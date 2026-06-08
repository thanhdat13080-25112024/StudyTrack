import pytest
from starlette.websockets import WebSocketDisconnect


def _register(client, email="ws@e.com"):
    r = client.post(
        "/api/auth/register", json={"email": email, "password": "pw123456", "name": "W"}
    )
    return r.json()["access_token"]


def test_ws_requires_valid_token(client):
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/ws/notifications?token=bogus"):
            pass


def test_ws_connects_and_receives_push(client, db_session):
    import asyncio

    from app.core.security import decode_access_token
    from app.models.user import User
    from app.realtime.manager import manager
    from sqlalchemy import select

    token = _register(client)
    email = decode_access_token(token)["sub"]
    uid = db_session.scalar(select(User.id).where(User.email == email))

    with client.websocket_connect(f"/ws/notifications?token={token}") as ws:
        # push to this user from the app's event loop
        asyncio.run(manager.send_to_user(uid, {"type": "ping"}))
        assert ws.receive_json() == {"type": "ping"}
