/** Ergonomic aliases over the generated OpenAPI types for deadlines. */
import type { components } from '@/lib/api-types';

type Schemas = components['schemas'];

export type Deadline = Schemas['DeadlineOut'];
export type DeadlineCreate = Schemas['DeadlineCreate'];
export type DeadlineUpdate = Schemas['DeadlineUpdate'];

export const DEADLINE_TYPES = ['assignment', 'exam', 'project'] as const;
export const DEADLINE_PRIORITIES = ['low', 'medium', 'high'] as const;

/** Reminder presets (minutes); null = no reminder. */
export const REMIND_PRESETS: { key: string; minutes: number | null }[] = [
  { key: 'none', minutes: null },
  { key: 'h1', minutes: 60 },
  { key: 'h3', minutes: 180 },
  { key: 'd1', minutes: 1440 },
  { key: 'd3', minutes: 4320 },
  { key: 'w1', minutes: 10080 },
];
