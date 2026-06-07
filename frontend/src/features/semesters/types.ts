/** Ergonomic aliases over the generated OpenAPI types for semesters. */
import type { components } from '@/lib/api-types';

type Schemas = components['schemas'];

export type Semester = Schemas['SemesterOut'];
export type SemesterCreate = Schemas['SemesterCreate'];
