"""WebSocket endpoint for realtime notifications. Auth via ?token= query param
(browsers can't set headers on the WS handshake). Registers the socket in the
shared ConnectionManager and drains inbound frames until disconnect."""

from __future__ import annotations

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.realtime.manager import manager

router = APIRouter()


@router.websocket("/ws/notifications")
async def notifications_ws(websocket: WebSocket, db: Session = Depends(get_db)) -> None:
    token = websocket.query_params.get("token")
    user: User | None = None
    if token:
        payload = decode_access_token(token)
        email = payload.get("sub") if payload else None
        if email:
            user = db.scalar(select(User).where(User.email == email))
    if user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    await manager.connect(user.id, websocket)
    try:
        while True:
            await websocket.receive_text()  # ignore inbound (keep-alive/ping)
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(user.id, websocket)
