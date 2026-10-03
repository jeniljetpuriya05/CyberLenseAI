"""
PCAP Packet Flow Extractor using Scapy.
Groups raw packets into bidirectional 5-tuple network flows and computes
statistical flow features corresponding to the CIC-IDS2017 training schema.
"""
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
import math
import numpy as np
import pandas as pd
from scapy.layers.inet import IP, TCP, UDP, ICMP
from scapy.packet import Packet

# CICFlowMeter-compatible flow termination settings
FLOW_IDLE_TIMEOUT = 120.0  # seconds — terminate flow if no packet for 120s

root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from ml.preprocessing.preprocessing import FEATURE_COLUMNS


def get_packet_endpoints(packet: Packet) -> Optional[Tuple[str, str, int, int, int]]:
    """
    Extract 5-tuple from a Scapy packet: (src_ip, dst_ip, src_port, dst_port, protocol).
    Returns None if packet is not an IP packet.
    """
    if not packet.haslayer(IP):
        return None

    src_ip = str(packet[IP].src)
    dst_ip = str(packet[IP].dst)
    proto_num = int(packet[IP].proto)
    src_port = 0
    dst_port = 0

    if packet.haslayer(TCP):
        src_port = int(packet[TCP].sport)
        dst_port = int(packet[TCP].dport)
    elif packet.haslayer(UDP):
        src_port = int(packet[UDP].sport)
        dst_port = int(packet[UDP].dport)
    elif packet.haslayer(ICMP):
        src_port = 0
        dst_port = int(packet[ICMP].type)

    return src_ip, dst_ip, src_port, dst_port, proto_num


class FlowAccumulator:
    """Tracks bidirectional packets and timing for a single network flow."""

    def __init__(self, fwd_src_ip: str, fwd_dst_ip: str, fwd_sport: int, fwd_dport: int, proto: int, start_time: float):
        self.src_ip = fwd_src_ip
        self.dst_ip = fwd_dst_ip
        self.src_port = fwd_sport
        self.dst_port = fwd_dport
        self.protocol = proto

        self.start_time = float(start_time)
        self.last_time = float(start_time)

        self.fwd_packets: int = 0
        self.bwd_packets: int = 0
        self.fwd_bytes: int = 0
        self.bwd_bytes: int = 0
        self.all_packet_lengths: List[int] = []
        self.fin_seen: bool = False
        self.rst_seen: bool = False

    def add_packet(self, packet: Packet, is_fwd: bool, pkt_time: float, pkt_len: int):
        pkt_time_f = float(pkt_time)
        if pkt_time_f > self.last_time:
            self.last_time = pkt_time_f
        if pkt_time_f < self.start_time:
            self.start_time = pkt_time_f

        self.all_packet_lengths.append(pkt_len)
        if is_fwd:
            self.fwd_packets += 1
            self.fwd_bytes += pkt_len
        else:
            self.bwd_packets += 1
            self.bwd_bytes += pkt_len

        # Track TCP termination flags
        if packet.haslayer(TCP):
            flags = packet[TCP].flags
            if flags & 0x01:  # FIN
                self.fin_seen = True
            if flags & 0x04:  # RST
                self.rst_seen = True

    def is_expired(self, current_time: float) -> bool:
        """Check if flow should be terminated (idle timeout or TCP FIN/RST)."""
        if self.fin_seen or self.rst_seen:
            return True
        if (current_time - self.last_time) > FLOW_IDLE_TIMEOUT:
            return True
        return False

    def to_features(self) -> Dict[str, float]:
        """
        Compute statistical features matching CIC-IDS2017 schema.
        In CIC-IDS2017: Flow Duration is recorded in microseconds (1 sec = 1,000,000 us).
        """
        duration_sec = max(0.0, self.last_time - self.start_time)
        # Flow duration in microseconds (CIC-IDS2017 standard unit)
        duration_us = duration_sec * 1_000_000.0

        total_packets = self.fwd_packets + self.bwd_packets
        total_bytes = self.fwd_bytes + self.bwd_bytes

        if duration_sec > 0.0:
            flow_bytes_per_sec = float(total_bytes) / duration_sec
            flow_pkts_per_sec = float(total_packets) / duration_sec
        else:
            flow_bytes_per_sec = 0.0
            flow_pkts_per_sec = 0.0

        if self.all_packet_lengths:
            lengths_arr = np.array(self.all_packet_lengths, dtype=float)
            pkt_len_mean = float(np.mean(lengths_arr))
            pkt_len_std = float(np.std(lengths_arr)) if len(lengths_arr) > 1 else 0.0
        else:
            pkt_len_mean = 0.0
            pkt_len_std = 0.0

        if math.isnan(pkt_len_std) or math.isinf(pkt_len_std):
            pkt_len_std = 0.0
        if math.isnan(flow_bytes_per_sec) or math.isinf(flow_bytes_per_sec):
            flow_bytes_per_sec = 0.0
        if math.isnan(flow_pkts_per_sec) or math.isinf(flow_pkts_per_sec):
            flow_pkts_per_sec = 0.0

        return {
            "Destination Port": float(self.dst_port),
            "Flow Duration": float(duration_us),
            "Total Fwd Packets": float(self.fwd_packets),
            "Total Backward Packets": float(self.bwd_packets),
            "Total Length of Fwd Packets": float(self.fwd_bytes),
            "Total Length of Bwd Packets": float(self.bwd_bytes),
            "Flow Bytes/s": float(flow_bytes_per_sec),
            "Flow Packets/s": float(flow_pkts_per_sec),
            "Packet Length Mean": float(pkt_len_mean),
            "Packet Length Std": float(pkt_len_std),
        }

    def to_metadata(self, flow_index: int) -> Dict[str, Any]:
        """Summary metadata for reporting/storage."""
        proto_map = {6: "TCP", 17: "UDP", 1: "ICMP"}
        proto_str = proto_map.get(self.protocol, f"Proto-{self.protocol}")
        return {
            "flow_id": f"FLOW-{flow_index:04d}",
            "src_ip": self.src_ip,
            "dst_ip": self.dst_ip,
            "src_port": self.src_port,
            "dst_port": self.dst_port,
            "protocol": proto_str,
            "total_packets": self.fwd_packets + self.bwd_packets,
            "total_bytes": self.fwd_bytes + self.bwd_bytes,
            "duration_seconds": round(max(0.0, self.last_time - self.start_time), 4),
            "start_time": self.start_time,
        }


def extract_flows_from_packets(packets: List[Packet]) -> Tuple[pd.DataFrame, List[Dict[str, Any]]]:
    """
    Extract bidirectional network flows and features from Scapy packets.
    Uses idle timeout (120s) and TCP FIN/RST to terminate flows,
    matching CICFlowMeter behavior used to generate CIC-IDS2017 training data.

    Returns:
        features_df (pd.DataFrame): DataFrame containing rows with exact FEATURE_COLUMNS.
        flow_metadata (List[Dict]): List of metadata dictionaries for each flow.
    """
    active_flows: Dict[Any, FlowAccumulator] = {}
    completed_flows: List[FlowAccumulator] = []

    for pkt in packets:
        endpoints = get_packet_endpoints(pkt)
        if endpoints is None:
            continue

        src_ip, dst_ip, sport, dport, proto = endpoints
        pkt_time = float(getattr(pkt, 'time', 0.0))
        pkt_len = len(pkt)

        if (src_ip, sport) <= (dst_ip, dport):
            canonical_key = (src_ip, dst_ip, sport, dport, proto)
        else:
            canonical_key = (dst_ip, src_ip, dport, sport, proto)

        # Check if existing flow has expired
        if canonical_key in active_flows:
            existing = active_flows[canonical_key]
            if existing.is_expired(pkt_time):
                # Finalize the expired flow and start a new one
                completed_flows.append(existing)
                del active_flows[canonical_key]

        if canonical_key not in active_flows:
            accumulator = FlowAccumulator(
                fwd_src_ip=src_ip,
                fwd_dst_ip=dst_ip,
                fwd_sport=sport,
                fwd_dport=dport,
                proto=proto,
                start_time=pkt_time,
            )
            active_flows[canonical_key] = accumulator
            accumulator.add_packet(pkt, is_fwd=True, pkt_time=pkt_time, pkt_len=pkt_len)
        else:
            accumulator = active_flows[canonical_key]
            is_fwd = (src_ip == accumulator.src_ip and sport == accumulator.src_port)
            accumulator.add_packet(pkt, is_fwd=is_fwd, pkt_time=pkt_time, pkt_len=pkt_len)

    # Finalize any remaining active flows
    completed_flows.extend(active_flows.values())

    if not completed_flows:
        return pd.DataFrame(columns=FEATURE_COLUMNS), []

    features_rows = []
    metadata_list = []

    for idx, accumulator in enumerate(completed_flows, start=1):
        feat_dict = accumulator.to_features()
        meta_dict = accumulator.to_metadata(idx)
        features_rows.append(feat_dict)
        metadata_list.append(meta_dict)

    features_df = pd.DataFrame(features_rows, columns=FEATURE_COLUMNS)
    return features_df, metadata_list


def validate_feature_vector(features_df: pd.DataFrame, expected_columns: Optional[List[str]] = None) -> bool:
    """
    Validate incoming feature dataframe against the expected training schema.
    Cleans invalid rows instead of crashing the entire prediction.

    Raises:
        ValueError: If feature column names do not match expected schema.
    """
    expected = expected_columns or FEATURE_COLUMNS

    if list(features_df.columns) != expected:
        diff_missing = [c for c in expected if c not in features_df.columns]
        diff_extra = [c for c in features_df.columns if c not in expected]
        raise ValueError(
            f"Feature schema mismatch:\n"
            f"  Expected {len(expected)} columns in order: {expected}\n"
            f"  Received {len(features_df.columns)} columns: {list(features_df.columns)}\n"
            f"  Missing: {diff_missing}\n"
            f"  Extra: {diff_extra}"
        )

    # Replace inf with NaN, then fill NaN with 0 to avoid crashing
    features_df.replace([np.inf, -np.inf], np.nan, inplace=True)
    features_df.fillna(0.0, inplace=True)

    return True
