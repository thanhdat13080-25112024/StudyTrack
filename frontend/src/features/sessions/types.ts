/** Ergonomic aliases over the generated OpenAPI types for study sessions. */
import type { components } from '@/lib/api-types';

type Schemas = components['schemas'];

export type StudySession = Schemas['StudySessionOut'];
export type StudySessionCreate = Schemas['StudySessionCreate'];
export type Dashboard = Schemas['DashboardOut'];
export type Suggestion = Schemas['SuggestionOut'];
export type SuggestionIn = Schemas['SuggestionIn'];

/** Study methods — matches the backend `StudyMethod` literal + legacy <select>. */
export const STUDY_METHODS = ['Pomodoro', 'Deep Work', 'Active Recall'] as const;
export type StudyMethod = (typeof STUDY_METHODS)[number];
