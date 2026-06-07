/** Ergonomic aliases over the generated OpenAPI types for schedule items. */
import type { components } from '@/lib/api-types';

type Schemas = components['schemas'];

export type ScheduleItem = Schemas['ScheduleItemOut'];
export type ScheduleItemCreate = Schemas['ScheduleItemCreate'];
export type ScheduleItemUpdate = Schemas['ScheduleItemUpdate'];

/** Day keys, index = day_of_week (0=Mon .. 6=Sun). i18n under `days.<key>`. */
export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type DayKey = (typeof DAY_KEYS)[number];
