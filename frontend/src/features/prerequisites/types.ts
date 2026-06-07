/** Ergonomic aliases over the generated OpenAPI types for prerequisites. */
import type { components } from '@/lib/api-types';

type Schemas = components['schemas'];

export type Prerequisite = Schemas['PrerequisiteOut'];
export type PrerequisiteCreate = Schemas['PrerequisiteCreate'];
