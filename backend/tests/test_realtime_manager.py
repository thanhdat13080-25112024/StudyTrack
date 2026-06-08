import asyncio

from app.realtime.manager import ConnectionManager


class FakeWS:
    def __init__(self):
        self.sent = []

    async def send_json(self, data):
        self.sent.append(data)


def test_send_to_user_fans_out_to_all_sockets():
    async def run():
        m = ConnectionManager()
        a, b = FakeWS(), FakeWS()
        await m.connect(1, a)
        await m.connect(1, b)
        await m.connect(2, FakeWS())
        await m.send_to_user(1, {"hello": "world"})
        assert a.sent == [{"hello": "world"}]
        assert b.sent == [{"hello": "world"}]

    asyncio.run(run())


def test_disconnect_removes_socket():
    async def run():
        m = ConnectionManager()
        a = FakeWS()
        await m.connect(1, a)
        m.disconnect(1, a)
        await m.send_to_user(1, {"x": 1})
        assert a.sent == []

    asyncio.run(run())


def test_send_to_unknown_user_is_noop():
    async def run():
        m = ConnectionManager()
        await m.send_to_user(999, {"x": 1})  # must not raise

    asyncio.run(run())
