def _auth(client, email="an@x.io"):
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


def _sem(client, h, code):
    r = client.post("/api/semesters", json={"code": code}, headers=h)
    assert r.status_code == 201
    return r.json()["id"]


def _grade(client, h, course_id, sem_id, grade_10, status="passed"):
    r = client.post(
        "/api/grades",
        json={
            "course_id": course_id,
            "semester_id": sem_id,
            "grade_10": grade_10,
            "status": status,
        },
        headers=h,
    )
    assert r.status_code == 201, r.text


def test_weak_subjects_flags_failed_course(client):
    h = _auth(client)
    s = _sem(client, h, "2024-1")
    c = _course(client, h, "HARD")
    _grade(client, h, c, s, 3.0, status="failed")
    out = client.get("/api/analysis/weak-subjects", headers=h).json()
    assert any(w["course_id"] == c and w["priority"] == "red" for w in out)


def test_direction_strongest_category(client):
    h = _auth(client)
    s = _sem(client, h, "2024-1")
    c1 = _course(client, h, "SP1")
    c2 = _course(client, h, "GN1")
    client.put(
        f"/api/courses/{c1}",
        json={"code": "SP1", "name": "SP1", "credits": 3, "category": "specialized"},
        headers=h,
    )
    client.put(
        f"/api/courses/{c2}",
        json={"code": "GN1", "name": "GN1", "credits": 3, "category": "general"},
        headers=h,
    )
    _grade(client, h, c1, s, 9.0)  # A -> 4.0
    _grade(client, h, c2, s, 5.5)  # C -> 2.0
    out = client.get("/api/analysis/direction", headers=h).json()
    assert out["strongest_category"] == "specialized"
