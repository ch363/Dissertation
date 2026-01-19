import { correctToGrade, scoreToGrade } from './grade';

describe('FSRS grade mapping', () => {
  describe('scoreToGrade', () => {
    it('should map scores to grades correctly', () => {
      expect(scoreToGrade(100)).toBe(5);
      expect(scoreToGrade(95)).toBe(5);
      expect(scoreToGrade(94)).toBe(4);
      expect(scoreToGrade(85)).toBe(4);
      expect(scoreToGrade(84)).toBe(3);
      expect(scoreToGrade(70)).toBe(3);
      expect(scoreToGrade(69)).toBe(2);
      expect(scoreToGrade(50)).toBe(2);
      expect(scoreToGrade(49)).toBe(1);
      expect(scoreToGrade(30)).toBe(1);
      expect(scoreToGrade(29)).toBe(0);
      expect(scoreToGrade(0)).toBe(0);
    });

    it('should clamp scores outside valid range', () => {
      expect(scoreToGrade(150)).toBe(5);
      expect(scoreToGrade(-10)).toBe(0);
    });
  });

  describe('correctToGrade', () => {
    it('should return 0 for incorrect answers', () => {
      expect(correctToGrade(false)).toBe(0);
      expect(correctToGrade(false, 1000)).toBe(0);
    });

    it('should return 5 for fast correct answers', () => {
      expect(correctToGrade(true, 3000)).toBe(5);
      expect(correctToGrade(true, 4999)).toBe(5);
    });

    it('should return 4 for moderate correct answers', () => {
      expect(correctToGrade(true, 5000)).toBe(4);
      expect(correctToGrade(true, 9999)).toBe(4);
    });

    it('should return 3 for slow correct answers', () => {
      expect(correctToGrade(true, 10000)).toBe(3);
      expect(correctToGrade(true, 30000)).toBe(3);
    });

    it('should return 3 for correct answers without time', () => {
      expect(correctToGrade(true)).toBe(3);
    });
  });
});

