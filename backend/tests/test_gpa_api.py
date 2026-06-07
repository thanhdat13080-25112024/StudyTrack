from tests.test_grades_api import _course, _sem
from tests.test_semesters_api import _auth


def _profile(client, h, target=3.2, total=140):
    # requires Task A5.1 (academic fields writable on ProfileUpdate)
    client.put(
        "/api/profile", json={"target_cpa": target, "total_credits_required": total}, headers=h
    )


def _seed_completed(client, h, total_credits, grade=7.0, sem_code="2024-1"):
    """Create passed grades summing to `total_credits`. Courses are capped at 30
    credits (CourseBase.credits le=30), so a large base is split across courses;
    equal grades weight-average to the same CPA regardless of the split."""
    sid = _sem(client, h, sem_code)
    remaining, i = total_credits, 0
    while remaining > 0:
        c = min(30, remaining)
        cid = _course(client, h, code=f"C{sem_code}-{i}", credits=c)
        client.post(
            "/api/grades",
            json={"course_id": cid, "semester_id": sid, "grade_10": grade, "status": "passed"},
            headers=h,
        )
        remaining -= c
        i += 1
    return sid


def test_gpa_summary(client):
    h = _auth(client, "p@x.com")
    cid, sid = _course(client, h, credits=3), _sem(client, h)
    client.post(
        "/api/grades",
        json={"course_id": cid, "semester_id": sid, "grade_10": 8.0, "status": "passed"},
        headers=h,
    )
    _profile(client, h)
    r = client.get("/api/gpa", headers=h)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["cpa"] == 3.5 and body["classification"] == "gioi"  # 3.5 < 3.6 → gioi
    assert body["credits"]["earned"] == 3 and body["credits"]["required"] == 140
    assert body["semesters"][0]["gpa"] == 3.5


def test_what_if_goal_seek_defaults_from_profile(client):
    h = _auth(client, "p2@x.com")
    _seed_completed(client, h, 90)  # 3.0 over 90
    _profile(client, h, target=3.3, total=140)
    r = client.post("/api/gpa/what-if", json={}, headers=h)
    assert r.status_code == 200, r.text
    gs = r.json()["goal_seek"]
    assert gs["remaining_credits"] == 50
    assert gs["required_avg"] == round((3.3 * 140 - 3.0 * 90) / 50, 2)
    assert r.json()["projection"] is None


def test_what_if_projection(client):
    h = _auth(client, "p3@x.com")
    _seed_completed(client, h, 90)  # 3.0 over 90
    r = client.post(
        "/api/gpa/what-if", json={"hypotheticals": [{"credits": 3, "grade_10": 8.0}]}, headers=h
    )
    proj = r.json()["projection"]
    assert proj["projected_cpa"] == round((3.0 * 90 + 3.5 * 3) / 93, 2)
