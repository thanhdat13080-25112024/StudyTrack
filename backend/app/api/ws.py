"""WebSocket endpoint for realtime notifications. Auth via ?token= query param
(browsers can't set headers on the WS handshake). Registers the socket in the
shared ConnectionManager and drains inbound frames until disconnect."""

from __future__ import annotations

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.core.security import decode_access_token, token_predates_password_change
from app.models.user import User
from app.realtime.manager import manager

router = APIRouter()


@router.websocket("/ws/notifications")
async def notifications_ws(websocket: WebSocket, db: Session = Depends(get_db)) -> None:
    token = websocket.query_params.get("token")
    user_id: int | None = None
    if token:
        payload = decode_access_token(token)
        email = payload.get("sub") if payload else None
        if email:
            user = db.scalar(select(User).where(User.email == email))
            if user is not None and not token_predates_password_change(
                payload, user.password_changed_at
            ):
                user_id = user.id
    # Release the pooled connection BEFORE the long-lived receive loop: the
    # dependency's own close only runs after disconnect, so without this every
    # open socket pins one pooled connection and ~15 concurrent sockets would
    # exhaust the default pool (5 + 10 overflow) and block all HTTP requests.
    db.close()
    if user_id is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()  # ignore inbound (keep-alive/ping)
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(user_id, websocket)
