def test_create_case_authenticated(client, auth_headers):
    response = client.post(
        "/api/v1/cases/",
        headers=auth_headers,
        json={"title": "Operation Test", "description": "Suspicious traffic"},
    )
    assert response.status_code == 201
    assert response.get_json()["title"] == "Operation Test"


def test_get_all_cases(client, auth_headers):
    client.post(
        "/api/v1/cases/",
        headers=auth_headers,
        json={"title": "Operation Test", "description": "Suspicious traffic"},
    )
    response = client.get("/api/v1/cases/", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)
    assert len(response.get_json()) == 1


def test_get_single_case(client, auth_headers):
    created = client.post(
        "/api/v1/cases/",
        headers=auth_headers,
        json={"title": "Operation Test", "description": "Suspicious traffic"},
    ).get_json()
    response = client.get(f"/api/v1/cases/{created['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert response.get_json()["id"] == created["id"]


def test_get_case_without_auth(client):
    response = client.get("/api/v1/cases/1")
    assert response.status_code == 401
