/** Profile facade — public API for reading/upserting the user profile. */
export type { Profile } from '../../lib/profile';
export {
	/** Fetch the current user's profile row or null. */
	getMyProfile,
	/** Upsert fields on the current user's profile; throws if no user. */
	upsertMyProfile,
	/** Ensure a profile row exists; optionally fills missing name. */
	ensureProfileSeed,
} from '../../lib/profile';
