def _auth(client, email="a@x.com"):
    r = client.post(
        "/api/auth/register", json={"email": email, "password": "pw123456", "name": "A"}
    )
    assert r.status_code == 201, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_semester_crud_and_scoping(client):
    h = _auth(client)
    r = client.post("/api/semesters", json={"code": "2024-1", "name": "HK1"}, headers=h)
    assert r.status_code == 201, r.text
    sid = r.json()["id"]

    assert client.get("/api/semesters", headers=h).json()[0]["code"] == "2024-1"

    r = client.put(
        f"/api/semesters/{sid}", json={"code": "2024-1", "name": "HK1 updated"}, headers=h
    )
    assert r.json()["name"] == "HK1 updated"

    # other user cannot see/delete it
    h2 = _auth(client, "b@x.com")
    assert client.get("/api/semesters", headers=h2).json() == []
    assert client.delete(f"/api/semesters/{sid}", headers=h2).status_code == 404

    assert client.delete(f"/api/semesters/{sid}", headers=h).status_code == 204
    assert client.get("/api/semesters", headers=h).json() == []
