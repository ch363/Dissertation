/** Content facade — API for reading learning content. */
export {
	/** Fetch sentences and translations; see repo for shapes. */
	getSentencesWithTranslations,
	/** Fetch cloze templates for sentence practice. */
	getClozeTemplatesForSentence,
} from '../../lib/contentRepo';
