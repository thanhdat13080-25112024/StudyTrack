/** Ergonomic aliases over the generated OpenAPI types for notifications. */
import type { components } from '@/lib/api-types';

type Schemas = components['schemas'];

export type Notification = Schemas['NotificationOut'];
export type UnreadCount = Schemas['UnreadCountOut'];
