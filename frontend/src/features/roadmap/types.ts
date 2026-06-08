/** Ergonomic aliases over the generated OpenAPI types for the roadmap. */
import type { components } from '@/lib/api-types';

type Schemas = components['schemas'];

export type RoadmapPlan = Schemas['RoadmapOut'];
export type RoadmapIn = Schemas['RoadmapIn'];
export type RoadmapSemester = Schemas['RoadmapSemesterOut'];
export type RoadmapWarning = Schemas['RoadmapWarningOut'];
