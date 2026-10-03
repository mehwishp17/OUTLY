import { callBackend } from "@/lib/api/client";

/**
 * One WebSocket per browser tab to the backend's `/ws/chat/` channel, which
 * pushes `message.created|updated|deleted` and `notification.created` events
 * for the signed-in user. The browser never holds the JWT: it asks the
 * backend (through the session proxy) for a 60-second ticket and connects
 * with that. Needs `NEXT_PUBLIC_OUTLY_WS_URL` (e.g. ws://127.0.0.1:8000/ws/chat/);
 * without it, or while disconnected, the stores fall back to polling.
 */

export type RealtimeEvent = { type: string; [key: string]: unknown };
type Listener = (event: RealtimeEvent) => void;

const listeners = new Set<Listener>();
let socket: WebSocket | null = null;
let connected = false;
let wanted = false;
let attempt = 0;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
const statusListeners = new Set<() => void>();

export function isRealtimeConnected(): boolean {
  return connected;
}

export function subscribeRealtime(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Notified when the socket connects or drops (so UIs can switch to polling). */
export function subscribeRealtimeStatus(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

function setConnected(value: boolean) {
  if (connected === value) return;
  connected = value;
  statusListeners.forEach((listener) => listener());
}

async function open() {
  const base = process.env.NEXT_PUBLIC_OUTLY_WS_URL;
  if (!base || !wanted || typeof WebSocket === "undefined") return;
  const ticket = await callBackend<{ ticket: string }>("POST", "chats/ws-ticket");
  if (!wanted) return;
  if (!ticket.ok) {
    scheduleRetry();
    return;
  }
  const ws = new WebSocket(`${base}?ticket=${encodeURIComponent(ticket.data.ticket)}`);
  socket = ws;
  ws.onopen = () => {
    attempt = 0;
  };
  ws.onmessage = (message) => {
    try {
      const event = JSON.parse(String(message.data)) as RealtimeEvent;
      if (event.type === "ready") setConnected(true);
      listeners.forEach((listener) => listener(event));
    } catch {
      // ignore malformed frames
    }
  };
  ws.onclose = () => {
    if (socket === ws) socket = null;
    setConnected(false);
    if (wanted) scheduleRetry();
  };
  ws.onerror = () => ws.close();
}

function scheduleRetry() {
  clearTimeout(retryTimer);
  attempt += 1;
  retryTimer = setTimeout(() => void open(), Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5)));
}

/** Connects (idempotent). Call once the user is signed in. */
export function startRealtime(): void {
  if (wanted) return;
  wanted = true;
  void open();
}

/** Disconnects (call on log out). */
export function stopRealtime(): void {
  wanted = false;
  clearTimeout(retryTimer);
  attempt = 0;
  socket?.close();
  socket = null;
  setConnected(false);
}
