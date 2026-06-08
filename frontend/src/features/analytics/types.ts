/** Ergonomic aliases over the generated OpenAPI types for analytics. */
import type { components } from '@/lib/api-types';

type Schemas = components['schemas'];

export type Analytics = Schemas['AnalyticsOut'];
export type HeatmapPoint = Schemas['HeatmapPointOut'];
export type MethodTime = Schemas['MethodTimeOut'];
export type CourseTime = Schemas['CourseTimeOut'];
export type FocusPoint = Schemas['FocusPointOut'];
export type WeeklyComparison = Schemas['WeeklyComparisonOut'];
export type MonthlyComparison = Schemas['MonthlyComparisonOut'];
export type ProductivityScore = Schemas['ProductivityScoreOut'];
export type HourlyPoint = Schemas['HourlyPointOut'];
export type MethodEffectiveness = Schemas['MethodEffectivenessOut'];
