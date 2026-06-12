"""Card-theme + student-code fields on Profile (UI backlog 2026-06-12)."""


def _register(client, email="card@test.dev"):
    r = client.post(
        "/api/auth/register",
        json={"email": email, "password": "secret1", "name": "Card"},
    )
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_profile_defaults_card_theme(client):
    h = _register(client)
    body = client.get("/api/profile", headers=h).json()
    assert body["card_theme"] == "studytrack"
    assert body["student_code"] is None


def test_update_card_theme_and_student_code(client):
    h = _register(client, "card2@test.dev")
    r = client.put(
        "/api/profile",
        json={"card_theme": "vju-red", "student_code": "23020001"},
        headers=h,
    )
    assert r.status_code == 200
    assert r.json()["card_theme"] == "vju-red"
    assert r.json()["student_code"] == "23020001"


def test_reject_unknown_card_theme(client):
    h = _register(client, "card3@test.dev")
    r = client.put("/api/profile", json={"card_theme": "neon-pink"}, headers=h)
    assert r.status_code == 422
