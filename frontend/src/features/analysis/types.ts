/** Ergonomic aliases over the generated OpenAPI types for analysis. */
import type { components } from '@/lib/api-types';

type Schemas = components['schemas'];

export type WeakSubject = Schemas['WeakSubjectOut'];
export type Direction = Schemas['DirectionOut'];
