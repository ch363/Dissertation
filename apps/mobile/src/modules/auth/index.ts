/**
 * Authentication facade — public API for UI layers.
 * Wraps Supabase auth; keep UI decoupled from implementation details.
 */
export {
	/** Key for pending profile name storage during signup. */
	PENDING_PROFILE_NAME_KEY,
	/** Key for pending login email used on verify/bypass screens. */
	PENDING_LOGIN_EMAIL_KEY,
	/** Key for pending login password used on verify/bypass screens. */
	PENDING_LOGIN_PASSWORD_KEY,
	/**
	 * Sign up with email/password and optional display name.
	 * May return needsVerification=true when email confirmation is required.
	 * Throws on network/auth errors.
	 */
	signUpWithEmail,
	/** Sign in with email/password; rejects after a short timeout to improve UX. */
	signInWithEmail,
	/** Get the currently authenticated user or null. */
	getCurrentUser,
	/** Resend email verification to the given address. */
	resendVerificationEmail,
	/** Get current session object or null. */
	getSession,
	/** Complete PKCE auth by exchanging code for a session. */
	exchangeCodeForSession,
	/** Sign the current user out. */
	signOut,
} from '../../lib/auth';
