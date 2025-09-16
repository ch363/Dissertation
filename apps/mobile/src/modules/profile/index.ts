/** Profile facade — public API for reading/upserting the user profile. */
export type { Profile } from '../../lib/profile';
export { getMyProfile, upsertMyProfile, ensureProfileSeed } from '../../lib/profile';
