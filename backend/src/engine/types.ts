/**
 * Shared types for the adaptive learning engine.
 * The engine is a service layer (NOT middleware) that provides:
 * - Content delivery selection algorithms
 * - Spaced repetition scheduling (SRS)
 * - XP and scoring systems
 */

export type ItemKind = 'question' | 'teaching' | 'lesson';

export type DeliveryMode = 'mixed' | 'review' | 'new';
