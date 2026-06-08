def _auth(client, email="u@x.io"):
    r = client.post(
        "/api/auth/register", json={"email": email, "password": "pw123456", "name": "U"}
    )
    assert r.status_code == 201
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _course(client, h, code):
    r = client.post("/api/courses", json={"code": code, "name": code, "credits": 3}, headers=h)
    assert r.status_code == 201
    return r.json()["id"]


def test_create_list_delete_prerequisite(client):
    h = _auth(client)
    a = _course(client, h, "A")
    b = _course(client, h, "B")
    r = client.post("/api/prerequisites", json={"course_id": a, "prereq_course_id": b}, headers=h)
    assert r.status_code == 201
    pid = r.json()["id"]
    assert r.json()["prereq_code"] == "B"

    lst = client.get("/api/prerequisites", headers=h).json()
    assert len(lst) == 1

    assert client.delete(f"/api/prerequisites/{pid}", headers=h).status_code == 204
    assert client.get("/api/prerequisites", headers=h).json() == []


def test_self_loop_rejected(client):
    h = _auth(client)
    a = _course(client, h, "A")
    r = client.post("/api/prerequisites", json={"course_id": a, "prereq_course_id": a}, headers=h)
    assert r.status_code == 422


def test_cross_user_course_rejected(client):
    h1 = _auth(client, "one@x.io")
    h2 = _auth(client, "two@x.io")
    a = _course(client, h1, "A")
    b = _course(client, h2, "B")  # belongs to user 2
    r = client.post("/api/prerequisites", json={"course_id": a, "prereq_course_id": b}, headers=h1)
    assert r.status_code in (404, 422)
