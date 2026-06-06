/** Ergonomic aliases over the generated OpenAPI types (single source of truth). */
import type { components } from '@/lib/api-types';

type Schemas = components['schemas'];

export type Token = Schemas['Token'];
export type UserOut = Schemas['UserOut'];
export type ProfileOut = Schemas['ProfileOut'];
export type MeOut = Schemas['MeOut'];
export type UserRegister = Schemas['UserRegister'];
export type UserSettingsUpdate = Schemas['UserSettingsUpdate'];
export type ProfileUpdate = Schemas['ProfileUpdate'];
