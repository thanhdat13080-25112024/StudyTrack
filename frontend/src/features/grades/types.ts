/** Ergonomic aliases over the generated OpenAPI types for grades + GPA. */
import type { components } from '@/lib/api-types';

type Schemas = components['schemas'];

export type Grade = Schemas['GradeOut'];
export type GradeCreate = Schemas['GradeCreate'];
export type GpaSummary = Schemas['GpaSummaryOut'];
export type WhatIfIn = Schemas['WhatIfIn'];
export type WhatIfOut = Schemas['WhatIfOut'];
export type Hypothetical = Schemas['Hypothetical'];

export const GRADE_STATUSES = ['in_progress', 'passed', 'failed', 'exempt'] as const;
export type GradeStatus = (typeof GRADE_STATUSES)[number];
