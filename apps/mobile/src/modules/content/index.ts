/**
 * Content facade — public API for reading learning content.
 * Prefer these over importing from lib directly.
 */
export {
	/** Fetch sentences by language, with optional difficulty/limit. */
	fetchSentences,
	/**
	 * Fetch sentences joined with their translation for a target language.
	 * Returns sentences with `sentence_translations` array.
	 */
	fetchSentenceWithTranslation,
	/** Fetch enabled cloze templates, joined with sentence and translations. */
	fetchClozeTemplates,
} from '../../lib/contentRepo';
