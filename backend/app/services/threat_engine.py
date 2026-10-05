from collections import Counter, defaultdict

import numpy as np
from scapy.layers.inet import ICMP, IP, TCP, UDP
from scapy.packet import Raw
from sklearn.ensemble import IsolationForest

MAX_ANOMALY_FEATURE_ROWS = 10_000


def _packet_protocol(packet):
    if packet.haslayer(TCP):
        return "TCP", 6
    if packet.haslayer(UDP):
        return "UDP", 17
    if packet.haslayer(ICMP):
        return "ICMP", 1
    return "Other", 0


def detect_threats(packets):
    threats = []
    dst_ports_by_src = defaultdict(set)
    syn_counts = Counter()
    icmp_counts = Counter()
    large_payloads = Counter()
    features = []

    for packet in packets:
        if not packet.haslayer(IP):
            continue

        src_ip = packet[IP].src
        _protocol_name, protocol_num = _packet_protocol(packet)
        dst_port = 0
        is_tcp_syn = 0

        if packet.haslayer(TCP):
            dst_port = int(packet[TCP].dport)
            dst_ports_by_src[src_ip].add(dst_port)
            is_tcp_syn = int(packet[TCP].flags & 0x02 > 0)
            if is_tcp_syn and dst_port in {21, 22}:
                syn_counts[(src_ip, dst_port)] += 1
        elif packet.haslayer(UDP):
            dst_port = int(packet[UDP].dport)

        if packet.haslayer(ICMP):
            icmp_counts[src_ip] += 1

        payload_len = len(bytes(packet[Raw].load)) if packet.haslayer(Raw) else 0
        if payload_len > 8000:
            large_payloads[src_ip] += 1

        features.append([len(packet), protocol_num, dst_port, is_tcp_syn])

    for src_ip, ports in dst_ports_by_src.items():
        if len(ports) > 15:
            threats.append({
                "type": "Port Scan",
                "severity": "High",
                "src_ip": src_ip,
                "packet_count": len(ports),
            })

    for (src_ip, port), count in syn_counts.items():
        if count > 20:
            threats.append({
                "type": "Brute Force",
                "severity": "High",
                "src_ip": src_ip,
                "dst_port": port,
                "packet_count": count,
            })

    for src_ip, count in large_payloads.items():
        threats.append({
            "type": "Data Exfiltration",
            "severity": "Medium",
            "src_ip": src_ip,
            "packet_count": count,
        })

    for src_ip, count in icmp_counts.items():
        if count > 50:
            threats.append({
                "type": "ICMP Flood",
                "severity": "Low",
                "src_ip": src_ip,
                "packet_count": count,
            })

    anomaly_score = 0.0
    if len(features) >= 2:
        feature_sample = features[:MAX_ANOMALY_FEATURE_ROWS]
        matrix = np.array(feature_sample, dtype=float)
        model = IsolationForest(contamination=0.1, random_state=42)
        labels = model.fit_predict(matrix)
        anomaly_score = round(float(np.mean(labels == -1)), 4)

    return threats, anomaly_score
