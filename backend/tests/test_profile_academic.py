def _auth(client, email="prof@x.com"):
    r = client.post(
        "/api/auth/register", json={"email": email, "password": "pw123456", "name": "P"}
    )
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_profile_accepts_academic_fields(client):
    h = _auth(client)
    r = client.put(
        "/api/profile",
        json={"target_cpa": 3.4, "total_credits_required": 140, "expected_graduation": "2027-06"},
        headers=h,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["target_cpa"] == 3.4
    assert body["total_credits_required"] == 140
    assert body["expected_graduation"] == "2027-06"
