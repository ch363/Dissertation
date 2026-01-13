import { calculateSm2, scoreToQuality, correctToQuality, getInitialSm2State } from './algo.sm2';

describe('SM-2 Algorithm', () => {
  describe('getInitialSm2State', () => {
    it('should return initial state with correct defaults', () => {
      const state = getInitialSm2State();
      expect(state.intervalDays).toBe(1);
      expect(state.easeFactor).toBe(2.5);
      expect(state.repetitions).toBe(0);
    });
  });

  describe('scoreToQuality', () => {
    it('should map scores to quality correctly', () => {
      expect(scoreToQuality(100)).toBe(5);
      expect(scoreToQuality(95)).toBe(5);
      expect(scoreToQuality(94)).toBe(4);
      expect(scoreToQuality(85)).toBe(4);
      expect(scoreToQuality(84)).toBe(3);
      expect(scoreToQuality(70)).toBe(3);
      expect(scoreToQuality(69)).toBe(2);
      expect(scoreToQuality(50)).toBe(2);
      expect(scoreToQuality(49)).toBe(1);
      expect(scoreToQuality(30)).toBe(1);
      expect(scoreToQuality(29)).toBe(0);
      expect(scoreToQuality(0)).toBe(0);
    });

    it('should clamp scores outside valid range', () => {
      expect(scoreToQuality(150)).toBe(5);
      expect(scoreToQuality(-10)).toBe(0);
    });
  });

  describe('correctToQuality', () => {
    it('should return 0 for incorrect answers', () => {
      expect(correctToQuality(false)).toBe(0);
      expect(correctToQuality(false, 1000)).toBe(0);
    });

    it('should return 5 for fast correct answers', () => {
      expect(correctToQuality(true, 3000)).toBe(5);
      expect(correctToQuality(true, 4999)).toBe(5);
    });

    it('should return 4 for moderate correct answers', () => {
      expect(correctToQuality(true, 5000)).toBe(4);
      expect(correctToQuality(true, 9999)).toBe(4);
    });

    it('should return 3 for slow correct answers', () => {
      expect(correctToQuality(true, 10000)).toBe(3);
      expect(correctToQuality(true, 30000)).toBe(3);
    });

    it('should return 3 for correct answers without time', () => {
      expect(correctToQuality(true)).toBe(3);
    });
  });

  describe('calculateSm2', () => {
    const now = new Date('2024-01-01T00:00:00Z');

    it('should handle perfect response (quality 5)', () => {
      const state = getInitialSm2State();
      const result = calculateSm2(state, 5, now);

      expect(result.repetitions).toBe(1);
      expect(result.intervalDays).toBe(1);
      expect(result.easeFactor).toBeGreaterThan(2.5);
      expect(result.nextDue.getTime()).toBe(new Date('2024-01-02T00:00:00Z').getTime());
    });

    it('should handle good response (quality 4)', () => {
      const state = getInitialSm2State();
      const result = calculateSm2(state, 4, now);

      expect(result.repetitions).toBe(1);
      expect(result.intervalDays).toBe(1);
      // Quality 4: EF = 2.5 + (0.1 - (5-4) * (0.08 + (5-4) * 0.02))
      //          = 2.5 + (0.1 - 1 * 0.1) = 2.5 + 0 = 2.5
      expect(result.easeFactor).toBeGreaterThanOrEqual(2.5);
    });

    it('should handle acceptable response (quality 3)', () => {
      const state = getInitialSm2State();
      const result = calculateSm2(state, 3, now);

      expect(result.repetitions).toBe(1);
      expect(result.intervalDays).toBe(1);
      expect(result.easeFactor).toBeLessThan(2.5);
    });

    it('should reset on poor response (quality < 3)', () => {
      const state = { intervalDays: 10, easeFactor: 2.5, repetitions: 5 };
      const result = calculateSm2(state, 2, now);

      expect(result.repetitions).toBe(0);
      expect(result.intervalDays).toBe(1);
    });

    it('should increase interval on second repetition', () => {
      const state = { intervalDays: 1, easeFactor: 2.5, repetitions: 1 };
      const result = calculateSm2(state, 4, now);

      expect(result.repetitions).toBe(2);
      expect(result.intervalDays).toBe(6);
    });

    it('should multiply interval by ease factor on subsequent repetitions', () => {
      const state = { intervalDays: 6, easeFactor: 2.5, repetitions: 2 };
      const result = calculateSm2(state, 4, now);

      expect(result.repetitions).toBe(3);
      expect(result.intervalDays).toBe(15); // 6 * 2.5 = 15
    });

    it('should maintain minimum ease factor of 1.3', () => {
      const state = { intervalDays: 1, easeFactor: 1.3, repetitions: 1 };
      const result = calculateSm2(state, 0, now);

      expect(result.easeFactor).toBe(1.3);
    });

    it('should decrease ease factor on poor performance', () => {
      const state = { intervalDays: 10, easeFactor: 2.5, repetitions: 5 };
      const result = calculateSm2(state, 2, now);

      expect(result.easeFactor).toBeLessThan(2.5);
    });
  });
});
