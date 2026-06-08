/**
 * Live-notification bridge. Holds the most recent incoming notification (for a
 * toast) and a bump counter. The App subscribes the wsClient to push here and
 * invalidates the notification queries on each message.
 */
import { create } from 'zustand';

export interface LiveNotification {
  notification_type: string;
  payload: Record<string, unknown>;
}

interface NotificationState {
  latest: LiveNotification | null;
  receivedAt: number;
  push: (n: LiveNotification) => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  latest: null,
  receivedAt: 0,
  push: (n) => set({ latest: n, receivedAt: Date.now() }),
  clear: () => set({ latest: null }),
}));
