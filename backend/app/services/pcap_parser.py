import sys
import json
import logging
from pathlib import Path
from collections import Counter
from datetime import datetime

from flask import current_app, has_app_context
from scapy.all import ICMP, IP, TCP, UDP, DNS, PcapReader

from app.extensions import db
from app.models import AnalysisReport, PCAPFile
from app.services.threat_engine import detect_threats

_root = Path(__file__).resolve().parent.parent.parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from ml.packet_features.feature_extractor import extract_flows_from_packets
from ml.predict import ThreatPredictor

logger = logging.getLogger('CyberLens.PCAPParser')
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] [%(name)s] %(message)s')

# Deep ML/heuristic analysis is intentionally capped so large PCAP uploads stay responsive.
MAX_PACKETS_FOR_ML = 20_000
PROGRESS_COMMIT_INTERVAL = 5_000
MAX_STORED_ML_RESULTS = 500
MAX_THREAT_ROWS = 250


def _protocol_name(packet):
    if packet.haslayer(TCP):
        if packet.haslayer(DNS):
            return "DNS"
        dport = packet[TCP].dport
        sport = packet[TCP].sport
        if 80 in (dport, sport):
            return "HTTP"
        if 443 in (dport, sport):
            return "HTTPS"
        return "TCP"
    if packet.haslayer(UDP):
        if packet.haslayer(DNS):
            return "DNS"
        return "UDP"
    if packet.haslayer(ICMP):
        return "ICMP"
    return "Other"


def _build_timeline_from_counts(time_counts):
    return [{"time": t, "packets": c} for t, c in sorted(time_counts.items())]


def _parse_and_store(pcap_file_id):
    pcap_file = db.session.get(PCAPFile, pcap_file_id)
    if not pcap_file:
        return

    try:
        pcap_file.parse_status = "processing"
        db.session.commit()

        logger.info(f"[PCAP] Streaming analysis for file: {pcap_file.file_path}")

        src_ip_counter = Counter()
        dst_ip_counter = Counter()
        protocol_counter = Counter()
        packet_sizes_sum = 0
        time_counts = Counter()
        total_packets = 0
        first_time = None
        last_time = None

        analysis_packets = []

        # Stream with PcapReader to support large PCAP files (up to 2GB+) without OOM
        with PcapReader(pcap_file.file_path) as reader:
            for pkt in reader:
                total_packets += 1
                pkt_len = len(pkt)
                packet_sizes_sum += pkt_len
                protocol_counter[_protocol_name(pkt)] += 1

                pkt_time = float(pkt.time)
                if first_time is None:
                    first_time = pkt_time
                last_time = pkt_time

                if pkt.haslayer(IP):
                    src_ip_counter[pkt[IP].src] += 1
                    dst_ip_counter[pkt[IP].dst] += 1

                try:
                    dt = datetime.utcfromtimestamp(pkt_time)
                    time_counts[dt.strftime("%H:%M")] += 1
                except Exception:
                    pass

                if total_packets <= MAX_PACKETS_FOR_ML:
                    analysis_packets.append(pkt)

                if total_packets % PROGRESS_COMMIT_INTERVAL == 0:
                    pcap_file.packet_count = total_packets
                    db.session.commit()

        sampled_analysis = total_packets > len(analysis_packets)
        logger.info(
            f"[PCAP] Total packets processed: {total_packets} "
            f"(deep analysis sample: {len(analysis_packets)}, sampled={sampled_analysis})"
        )

        top_src = dict(src_ip_counter.most_common(20))
        top_dst = dict(dst_ip_counter.most_common(20))
        unique_src = sorted(src_ip_counter.keys())
        unique_dst = sorted(dst_ip_counter.keys())

        avg_size = round(packet_sizes_sum / total_packets, 2) if total_packets > 0 else 0.0
        duration = float(last_time - first_time) if (first_time is not None and last_time is not None and total_packets > 1) else 0.0
        timeline = _build_timeline_from_counts(time_counts)

        # Baseline heuristic threat detection on analysis packets
        threats, anomaly_score = detect_threats(analysis_packets)

        # --- ML THREAT DETECTION PIPELINE ---
        logger.info("[FLOW] Extracting network flows from packets...")
        features_df, flow_metadata = extract_flows_from_packets(analysis_packets)
        logger.info(f"[FLOW] Flows created: {len(flow_metadata)}")

        ml_model_status = "none"
        ml_total_flows = len(flow_metadata)
        ml_normal_flows = 0
        ml_malicious_flows = 0
        ml_detection_results = []

        if len(flow_metadata) > 0:
            try:
                logger.info("[ML] Running predictions with Random Forest model...")
                predictor = ThreatPredictor.get_instance()
                ml_prediction_output = predictor.predict_flows(features_df, flow_metadata)

                ml_model_status = "completed"
                ml_total_flows = ml_prediction_output["total_flows"]
                ml_normal_flows = ml_prediction_output["normal_flows"]
                ml_malicious_flows = ml_prediction_output["malicious_flows"]
                ml_detection_results = ml_prediction_output["results"][:MAX_STORED_ML_RESULTS]
                logger.info(
                    f"[ML] Analysis completed. Total flows: {ml_total_flows}, "
                    f"Normal: {ml_normal_flows}, Malicious: {ml_malicious_flows}"
                )

                # If malicious flows detected, append to threats summary
                for f_res in ml_detection_results:
                    if f_res["prediction"] == 1:
                        conf_pct = int(f_res["confidence"] * 100)
                        threats.append({
                            "type": "ML Flow Threat",
                            "severity": "High" if conf_pct >= 80 else "Medium",
                            "src_ip": f_res["src_ip"],
                            "dst_ip": f_res["dst_ip"],
                            "packet_count": f_res["total_packets"],
                            "confidence": f_res["confidence"],
                            "description": f"Classified Malicious by ML model with {conf_pct}% confidence ({f_res['protocol']} flow)",
                        })

                if sampled_analysis:
                    threats.append({
                        "type": "Large Capture Sampling",
                        "severity": "Info",
                        "src_ip": "N/A",
                        "dst_ip": "N/A",
                        "packet_count": len(analysis_packets),
                        "description": (
                            f"Deep ML flow analysis used the first {len(analysis_packets):,} "
                            f"of {total_packets:,} packets to reduce processing time. "
                            "Protocol, IP, timeline, and packet counts still use the full capture."
                        ),
                    })

            except FileNotFoundError as e:
                logger.warning(f"[ML] {e}")
                ml_model_status = "no_model"
            except Exception as e:
                logger.exception(f"[ML] Error executing ML flow predictions: {e}")
                ml_model_status = "error"

        report = AnalysisReport(
            pcap_id=pcap_file.id,
            case_id=pcap_file.case_id,
            total_packets=total_packets,
            unique_src_ips=json.dumps(unique_src),
            unique_dst_ips=json.dumps(unique_dst),
            protocols=json.dumps(dict(protocol_counter)),
            threats_detected=json.dumps(threats[:MAX_THREAT_ROWS]),
            anomaly_score=anomaly_score,
            capture_duration=duration,
            top_src_ips=json.dumps(top_src),
            top_dst_ips=json.dumps(top_dst),
            avg_packet_size=avg_size,
            packet_timeline=json.dumps(timeline),
            # ML fields
            ml_model_status=ml_model_status,
            ml_total_flows=ml_total_flows,
            ml_normal_flows=ml_normal_flows,
            ml_malicious_flows=ml_malicious_flows,
            ml_detection_results=json.dumps(ml_detection_results),
        )
        pcap_file.packet_count = total_packets
        pcap_file.parse_status = "done"
        db.session.add(report)
        db.session.commit()
        logger.info(f"[PCAP] Report saved for PCAP ID {pcap_file.id}")
    except Exception as e:
        logger.exception(f"[PCAP] Error processing PCAP file {pcap_file_id}: {e}")
        db.session.rollback()
        failed_file = db.session.get(PCAPFile, pcap_file_id)
        if failed_file:
            failed_file.parse_status = "failed"
            db.session.commit()


def parse_pcap_background(pcap_file_id):
    if has_app_context():
        app = current_app._get_current_object()
    else:
        from app import create_app
        app = create_app()
    with app.app_context():
        _parse_and_store(pcap_file_id)
