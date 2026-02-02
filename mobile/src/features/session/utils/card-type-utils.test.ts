import {
  isTeachCard,
  isMCQCard,
  isFillBlankCard,
  isFlashcard,
  isListeningCard,
  isPronunciationCard,
  cardRequiresSelection,
  cardRequiresTextInput,
  isListeningSpeakMode,
  getCardId,
  canSubmitCard,
} from './card-type-utils';
import { CardKind } from '@/types/session';

describe('Card Type Utils', () => {
  describe('isTeachCard', () => {
    it('should identify teaching cards', () => {
      const card = { kind: CardKind.Teach, teachingId: '1' } as any;
      expect(isTeachCard(card)).toBe(true);
    });

    it('should return false for non-teaching cards', () => {
      const card = { kind: CardKind.MCQ } as any;
      expect(isTeachCard(card)).toBe(false);
    });
  });

  describe('isMCQCard', () => {
    it('should identify MCQ cards', () => {
      const card = { kind: CardKind.MCQ } as any;
      expect(isMCQCard(card)).toBe(true);
    });
  });

  describe('cardRequiresSelection', () => {
    it('should return true for MCQ cards', () => {
      const card = { kind: CardKind.MCQ } as any;
      expect(cardRequiresSelection(card)).toBe(true);
    });

    it('should return true for fill blank with options', () => {
      const card = {
        kind: CardKind.FillBlank,
        options: [{ id: '1', label: 'Option 1' }],
      } as any;
      expect(cardRequiresSelection(card)).toBe(true);
    });

    it('should return false for fill blank without options', () => {
      const card = { kind: CardKind.FillBlank, options: [] } as any;
      expect(cardRequiresSelection(card)).toBe(false);
    });
  });

  describe('cardRequiresTextInput', () => {
    it('should return true for fill blank without options', () => {
      const card = { kind: CardKind.FillBlank, options: [] } as any;
      expect(cardRequiresTextInput(card)).toBe(true);
    });

    it('should return false for MCQ', () => {
      const card = { kind: CardKind.MCQ } as any;
      expect(cardRequiresTextInput(card)).toBe(false);
    });
  });

  describe('canSubmitCard', () => {
    it('should allow teaching card submission', () => {
      const card = { kind: CardKind.Teach } as any;
      const state = {};
      expect(canSubmitCard(card, state)).toBe(true);
    });

    it('should require option selection for MCQ', () => {
      const card = { kind: CardKind.MCQ } as any;
      const stateWithoutSelection = {};
      expect(canSubmitCard(card, stateWithoutSelection)).toBe(false);

      const stateWithSelection = { selectedOptionId: 'opt1' };
      expect(canSubmitCard(card, stateWithSelection)).toBe(true);
    });

    it('should require text input for fill blank', () => {
      const card = { kind: CardKind.FillBlank, options: [] } as any;
      const stateWithoutInput = { userAnswer: '' };
      expect(canSubmitCard(card, stateWithoutInput)).toBe(false);

      const stateWithInput = { userAnswer: 'answer' };
      expect(canSubmitCard(card, stateWithInput)).toBe(true);
    });

    it('should require rating for flashcard', () => {
      const card = { kind: CardKind.Flashcard } as any;
      const stateWithoutRating = {};
      expect(canSubmitCard(card, stateWithoutRating)).toBe(false);

      const stateWithRating = { flashcardRating: 3 };
      expect(canSubmitCard(card, stateWithRating)).toBe(true);
    });
  });
});
