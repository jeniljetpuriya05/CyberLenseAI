from io import BytesIO


def _create_case(client, auth_headers):
    return client.post(
        "/api/v1/cases/",
        headers=auth_headers,
        json={"title": "PCAP Case", "description": "Upload target"},
    ).get_json()


def test_upload_valid_pcap(client, auth_headers, sample_pcap_bytes):
    case = _create_case(client, auth_headers)
    response = client.post(
        "/api/v1/pcap/upload",
        headers=auth_headers,
        data={
            "case_id": str(case["id"]),
            "file": (BytesIO(sample_pcap_bytes), "capture.pcap"),
        },
        content_type="multipart/form-data",
    )
    body = response.get_json()
    assert response.status_code == 202
    assert body["pcap_id"] > 0


def test_upload_invalid_extension(client, auth_headers):
    case = _create_case(client, auth_headers)
    response = client.post(
        "/api/v1/pcap/upload",
        headers=auth_headers,
        data={
            "case_id": str(case["id"]),
            "file": (BytesIO(b"not a pcap"), "notes.txt"),
        },
        content_type="multipart/form-data",
    )
    assert response.status_code == 400


def test_check_uploaded_file_status(client, auth_headers, sample_pcap_bytes):
    case = _create_case(client, auth_headers)
    upload = client.post(
        "/api/v1/pcap/upload",
        headers=auth_headers,
        data={
            "case_id": str(case["id"]),
            "file": (BytesIO(sample_pcap_bytes), "capture.pcap"),
        },
        content_type="multipart/form-data",
    ).get_json()
    response = client.get(f"/api/v1/pcap/{upload['pcap_id']}/status", headers=auth_headers)
    assert response.status_code == 200
    assert response.get_json()["pcap_id"] == upload["pcap_id"]
