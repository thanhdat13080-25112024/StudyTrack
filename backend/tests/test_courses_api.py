from tests.test_semesters_api import _auth


def test_course_crud_and_validation(client):
    h = _auth(client, "c@x.com")
    r = client.post("/api/courses", json={
        "code": "CS101", "name": "Intro CS", "credits": 3,
        "category": "foundation", "is_required": True,
    }, headers=h)
    assert r.status_code == 201, r.text
    cid = r.json()["id"]
    assert client.get("/api/courses", headers=h).json()[0]["code"] == "CS101"

    # bad category rejected
    assert client.post("/api/courses", json={"code": "X", "name": "Y", "credits": 3,
                       "category": "nope"}, headers=h).status_code == 422
    # negative credits rejected
    assert client.post("/api/courses", json={"code": "Z", "name": "Y", "credits": -1},
                       headers=h).status_code == 422

    assert client.put(f"/api/courses/{cid}", json={"code": "CS101", "name": "Intro CS II",
                      "credits": 4}, headers=h).json()["credits"] == 4
    assert client.delete(f"/api/courses/{cid}", headers=h).status_code == 204
