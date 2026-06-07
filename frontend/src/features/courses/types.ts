/** Ergonomic aliases over the generated OpenAPI types for courses (CTĐT). */
import type { components } from '@/lib/api-types';

type Schemas = components['schemas'];

export type Course = Schemas['CourseOut'];
export type CourseCreate = Schemas['CourseCreate'];

export const COURSE_CATEGORIES = ['general', 'foundation', 'specialized', 'elective'] as const;
export type CourseCategory = (typeof COURSE_CATEGORIES)[number];
