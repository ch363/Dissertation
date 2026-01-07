/** Profile facade — public API for reading/upserting the user profile. */
export type { Profile } from '@/app/api/profile';
export { getMyProfile, upsertMyProfile, ensureProfileSeed } from '@/app/api/profile';
