"""In-memory WebSocket connection registry, keyed by user_id. Single-process
only (prod runs one uvicorn worker — no Redis). `notify_user` is a sync,
best-effort bridge for pushing from threadpool (sync) request handlers."""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Protocol

logger = logging.getLogger(__name__)


class _Socket(Protocol):
    async def send_json(self, data: Any) -> None: ...


class ConnectionManager:
    def __init__(self) -> None:
        self._conns: dict[int, set[_Socket]] = {}
        self._loop: asyncio.AbstractEventLoop | None = None

    def set_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """Record the running event loop so sync code can push cross-thread."""
        self._loop = loop

    async def connect(self, user_id: int, ws: _Socket) -> None:
        self._conns.setdefault(user_id, set()).add(ws)

    def disconnect(self, user_id: int, ws: _Socket) -> None:
        sockets = self._conns.get(user_id)
        if sockets:
            sockets.discard(ws)
            if not sockets:
                self._conns.pop(user_id, None)

    async def send_to_user(self, user_id: int, message: Any) -> None:
        for ws in list(self._conns.get(user_id, ())):
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(user_id, ws)

    def notify_user(self, user_id: int, message: Any) -> None:
        """Best-effort push from a synchronous context (no-op if no loop set)."""
        loop = self._loop
        if loop is None:
            return
        try:
            asyncio.run_coroutine_threadsafe(self.send_to_user(user_id, message), loop)
        except Exception:
            logger.warning("realtime push scheduling failed", exc_info=True)


# Module-level singleton shared by the ws endpoint, scanner, and sync routers.
manager = ConnectionManager()
