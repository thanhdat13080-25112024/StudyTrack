def _auth(client, email="rm@x.io"):
    r = client.post(
        "/api/auth/register", json={"email": email, "password": "pw123456", "name": "U"}
    )
    assert r.status_code == 201
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _course(client, h, code, credits=3):
    r = client.post(
        "/api/courses", json={"code": code, "name": code, "credits": credits}, headers=h
    )
    assert r.status_code == 201
    return r.json()["id"]


def test_generate_orders_by_prereq(client):
    h = _auth(client)
    a = _course(client, h, "A")
    b = _course(client, h, "B")
    client.post("/api/prerequisites", json={"course_id": a, "prereq_course_id": b}, headers=h)
    plan = client.post("/api/roadmap/generate", json={"start_code": "2025-1"}, headers=h).json()
    sem_of = {c["course_id"]: i for i, s in enumerate(plan["semesters"]) for c in s["courses"]}
    assert sem_of[b] < sem_of[a]


def test_generate_does_not_persist_then_apply_persists(client):
    h = _auth(client)
    _course(client, h, "A")
    client.post("/api/roadmap/generate", json={"start_code": "2025-1"}, headers=h)
    # not persisted
    assert client.get("/api/courses", headers=h).json()[0]["planned_semester_id"] is None
    # apply persists
    client.post("/api/roadmap/apply", json={"start_code": "2025-1"}, headers=h)
    course = client.get("/api/courses", headers=h).json()[0]
    assert course["planned_semester_id"] is not None
    # the planned semester now exists
    codes = [s["code"] for s in client.get("/api/semesters", headers=h).json()]
    assert "2025-1" in codes
