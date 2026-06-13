/**
 * Reconnecting WebSocket client for /ws/notifications. Token is passed as a
 * query param (browsers can't set headers on the WS handshake). Auto-reconnects
 * with exponential backoff. The WebSocket implementation is injectable for tests.
 */

export interface WsClientOptions {
  baseUrl: string;
  getToken: () => string | null;
  onMessage: (data: unknown) => void;
  WebSocketImpl?: typeof WebSocket;
  maxBackoffMs?: number;
}

export interface WsClient {
  connect: () => void;
  disconnect: () => void;
}

function toWsUrl(baseUrl: string): string {
  if (baseUrl.startsWith('https://')) return 'wss://' + baseUrl.slice('https://'.length);
  if (baseUrl.startsWith('http://')) return 'ws://' + baseUrl.slice('http://'.length);
  // relative/empty base: derive from page origin
  if (!baseUrl && typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    return proto + window.location.host;
  }
  return baseUrl;
}

export function createWsClient(opts: WsClientOptions): WsClient {
  const Impl = opts.WebSocketImpl ?? (globalThis.WebSocket as typeof WebSocket);
  const maxBackoff = opts.maxBackoffMs ?? 30_000;
  let ws: WebSocket | null = null;
  let closedByUser = false;
  let backoff = 1000;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function open() {
    const token = opts.getToken();
    if (!token) return;
    const url = `${toWsUrl(opts.baseUrl)}/ws/notifications?token=${encodeURIComponent(token)}`;
    ws = new Impl(url);
    ws.onopen = () => {
      backoff = 1000;
    };
    ws.onmessage = (e: MessageEvent) => {
      try {
        opts.onMessage(JSON.parse(e.data as string));
      } catch {
        /* ignore malformed frames */
      }
    };
    ws.onclose = (e: CloseEvent) => {
      ws = null;
      if (closedByUser) return;
      // 1008 (policy violation) = the server rejected our token (bad/expired/
      // revoked). Reconnecting with the same token just loops, so stop until the
      // next explicit connect() (e.g. after a fresh login).
      if (e.code === 1008) return;
      timer = setTimeout(open, backoff);
      backoff = Math.min(backoff * 2, maxBackoff);
    };
  }

  return {
    connect() {
      closedByUser = false;
      open();
    },
    disconnect() {
      closedByUser = true;
      if (timer) clearTimeout(timer);
      ws?.close();
      ws = null;
    },
  };
}
