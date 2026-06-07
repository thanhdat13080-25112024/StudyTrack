from tests.test_semesters_api import _auth


def _course(client, h, code="CS101", credits=3):
    return client.post("/api/courses", json={"code": code, "name": code, "credits": credits},
                       headers=h).json()["id"]


def _sem(client, h, code="2024-1"):
    return client.post("/api/semesters", json={"code": code}, headers=h).json()["id"]


def test_grade_create_computes_letter_and_embeds(client):
    h = _auth(client, "g@x.com")
    cid, sid = _course(client, h), _sem(client, h)
    r = client.post("/api/grades", json={"course_id": cid, "semester_id": sid,
                    "grade_10": 8.0, "status": "passed"}, headers=h)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["letter"] == "B+" and body["grade_4"] == 3.5
    assert body["course"]["code"] == "CS101" and body["semester"]["code"] == "2024-1"


def test_grade_status_consistency_rejected(client):
    h = _auth(client, "g2@x.com")
    cid, sid = _course(client, h), _sem(client, h)
    # passed without grade → 422
    assert client.post("/api/grades", json={"course_id": cid, "semester_id": sid,
                       "status": "passed"}, headers=h).status_code == 422
    # in_progress with grade → 422
    assert client.post("/api/grades", json={"course_id": cid, "semester_id": sid,
                       "grade_10": 7.0, "status": "in_progress"}, headers=h).status_code == 422


def test_grade_filter_by_semester_and_null_grade(client):
    h = _auth(client, "g3@x.com")
    cid, s1, s2 = _course(client, h), _sem(client, h, "2024-1"), _sem(client, h, "2024-2")
    client.post("/api/grades", json={"course_id": cid, "semester_id": s1, "grade_10": 9.0,
                "status": "passed"}, headers=h)
    cid2 = _course(client, h, "CS102")
    r = client.post("/api/grades", json={"course_id": cid2, "semester_id": s2,
                    "status": "in_progress"}, headers=h)
    assert r.json()["letter"] is None and r.json()["grade_4"] is None
    got = client.get(f"/api/grades?semester_id={s1}", headers=h).json()
    assert len(got) == 1 and got[0]["semester_id"] == s1
