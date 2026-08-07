import json
from collections import Counter
from datetime import datetime

from flask import current_app, has_app_context
from scapy.all import ICMP, IP, TCP, UDP, DNS, DNSQR, rdpcap

from app.extensions import db
from app.models import AnalysisReport, PCAPFile
from app.services.threat_engine import detect_threats


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


def _build_timeline(packets):
    """Group packets by minute and return list of {time, packets}."""
    if not packets:
        return []
    counts = Counter()
    for pkt in packets:
        try:
            dt = datetime.utcfromtimestamp(float(pkt.time))
            key = dt.strftime("%H:%M")
            counts[key] += 1
        except Exception:
            pass
    return [{"time": t, "packets": c} for t, c in sorted(counts.items())]


def _parse_and_store(pcap_file_id):
    pcap_file = db.session.get(PCAPFile, pcap_file_id)
    if not pcap_file:
        return

    try:
        pcap_file.parse_status = "processing"
        db.session.commit()

        packets = rdpcap(pcap_file.file_path)
        total_packets = len(packets)

        src_ip_counter = Counter()
        dst_ip_counter = Counter()
        protocol_counter = Counter()
        packet_sizes = []

        for pkt in packets:
            packet_sizes.append(len(pkt))
            protocol_counter[_protocol_name(pkt)] += 1
            if pkt.haslayer(IP):
                src_ip_counter[pkt[IP].src] += 1
                dst_ip_counter[pkt[IP].dst] += 1

        # Top 20 src/dst IPs with counts
        top_src = dict(src_ip_counter.most_common(20))
        top_dst = dict(dst_ip_counter.most_common(20))

        # Unique IP lists (for backward compat)
        unique_src = sorted(src_ip_counter.keys())
        unique_dst = sorted(dst_ip_counter.keys())

        avg_size = round(sum(packet_sizes) / len(packet_sizes), 2) if packet_sizes else 0.0
        duration = float(packets[-1].time - packets[0].time) if total_packets > 1 else 0.0
        timeline = _build_timeline(packets)

        threats, anomaly_score = detect_threats(packets)

        report = AnalysisReport(
            pcap_id=pcap_file.id,
            case_id=pcap_file.case_id,
            total_packets=total_packets,
            unique_src_ips=json.dumps(unique_src),
            unique_dst_ips=json.dumps(unique_dst),
            protocols=json.dumps(dict(protocol_counter)),
            threats_detected=json.dumps(threats),
            anomaly_score=anomaly_score,
            capture_duration=duration,
            top_src_ips=json.dumps(top_src),
            top_dst_ips=json.dumps(top_dst),
            avg_packet_size=avg_size,
            packet_timeline=json.dumps(timeline),
        )
        pcap_file.packet_count = total_packets
        pcap_file.parse_status = "done"
        db.session.add(report)
        db.session.commit()
    except Exception:
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
