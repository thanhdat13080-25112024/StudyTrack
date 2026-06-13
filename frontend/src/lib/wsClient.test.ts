// src/lib/wsClient.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWsClient } from './wsClient';

class MockWS {
  static instances: MockWS[] = [];
  url: string;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: ((e?: { code?: number }) => void) | null = null;
  onopen: (() => void) | null = null;
  readyState = 0;
  close = vi.fn(() => {
    this.readyState = 3;
    this.onclose?.({ code: 1000 });
  });
  constructor(url: string) {
    this.url = url;
    MockWS.instances.push(this);
  }
}

afterEach(() => {
  MockWS.instances = [];
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('wsClient', () => {
  it('builds a wss url from an https base and appends the token', () => {
    const client = createWsClient({
      baseUrl: 'https://api.example.com',
      getToken: () => 'tok',
      onMessage: () => {},
      WebSocketImpl: MockWS as unknown as typeof WebSocket,
    });
    client.connect();
    expect(MockWS.instances[0].url).toBe('wss://api.example.com/ws/notifications?token=tok');
    client.disconnect();
  });

  it('dispatches parsed messages to onMessage', () => {
    const onMessage = vi.fn();
    const client = createWsClient({
      baseUrl: 'http://localhost:8000',
      getToken: () => 'tok',
      onMessage,
      WebSocketImpl: MockWS as unknown as typeof WebSocket,
    });
    client.connect();
    MockWS.instances[0].onmessage?.({ data: JSON.stringify({ type: 'notification' }) });
    expect(onMessage).toHaveBeenCalledWith({ type: 'notification' });
    client.disconnect();
  });

  it('does not connect without a token', () => {
    const client = createWsClient({
      baseUrl: 'http://localhost:8000',
      getToken: () => null,
      onMessage: () => {},
      WebSocketImpl: MockWS as unknown as typeof WebSocket,
    });
    client.connect();
    expect(MockWS.instances.length).toBe(0);
  });

  it('reconnects after an abnormal (non-1008) close', () => {
    vi.useFakeTimers();
    const client = createWsClient({
      baseUrl: 'http://localhost:8000',
      getToken: () => 'tok',
      onMessage: () => {},
      WebSocketImpl: MockWS as unknown as typeof WebSocket,
    });
    client.connect();
    expect(MockWS.instances.length).toBe(1);
    MockWS.instances[0].onclose?.({ code: 1006 });
    vi.advanceTimersByTime(1000);
    expect(MockWS.instances.length).toBe(2);
    client.disconnect();
  });

  it('stops reconnecting after a 1008 (policy violation) close', () => {
    vi.useFakeTimers();
    const client = createWsClient({
      baseUrl: 'http://localhost:8000',
      getToken: () => 'tok',
      onMessage: () => {},
      WebSocketImpl: MockWS as unknown as typeof WebSocket,
    });
    client.connect();
    expect(MockWS.instances.length).toBe(1);
    // 1008 = the server rejected our token; retrying with the same token loops.
    MockWS.instances[0].onclose?.({ code: 1008 });
    vi.advanceTimersByTime(60_000);
    expect(MockWS.instances.length).toBe(1);
    client.disconnect();
  });
});
