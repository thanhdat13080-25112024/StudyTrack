// src/lib/wsClient.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWsClient } from './wsClient';

class MockWS {
  static instances: MockWS[] = [];
  url: string;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onopen: (() => void) | null = null;
  readyState = 0;
  close = vi.fn(() => {
    this.readyState = 3;
    this.onclose?.();
  });
  constructor(url: string) {
    this.url = url;
    MockWS.instances.push(this);
  }
}

afterEach(() => {
  MockWS.instances = [];
  vi.restoreAllMocks();
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
});
