import { Test, TestingModule } from '@nestjs/testing';
import {
  DifficultyCalculator,
  classifyDifficulty,
} from '../difficulty-calculator.service';

describe('DifficultyCalculator', () => {
  let service: DifficultyCalculator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DifficultyCalculator],
    }).compile();
    service = module.get<DifficultyCalculator>(DifficultyCalculator);
  });

  describe('calculateBaseDifficulty', () => {
    it('should map A1 to 0.1', () => {
      expect(service.calculateBaseDifficulty('A1')).toBe(0.1);
    });
    it('should map A2 to 0.3', () => {
      expect(service.calculateBaseDifficulty('A2')).toBe(0.3);
    });
    it('should map B1 to 0.5', () => {
      expect(service.calculateBaseDifficulty('B1')).toBe(0.5);
    });
    it('should map B2 to 0.7', () => {
      expect(service.calculateBaseDifficulty('B2')).toBe(0.7);
    });
    it('should map C1 to 0.85', () => {
      expect(service.calculateBaseDifficulty('C1')).toBe(0.85);
    });
    it('should map C2 to 1.0', () => {
      expect(service.calculateBaseDifficulty('C2')).toBe(1.0);
    });
    it('should return 0.5 for unknown knowledge level', () => {
      expect(service.calculateBaseDifficulty('UNKNOWN')).toBe(0.5);
      expect(service.calculateBaseDifficulty('')).toBe(0.5);
    });
  });

  describe('adjustDifficultyForMastery', () => {
    it('should not change difficulty when mastery is 0', () => {
      expect(service.adjustDifficultyForMastery(0.5, 0)).toBe(0.5);
    });
    it('should reduce difficulty when mastery is high', () => {
      expect(service.adjustDifficultyForMastery(0.5, 1, 0.3)).toBe(0.5 * 0.7);
    });
    it('should use default adjustment cap 0.3', () => {
      expect(service.adjustDifficultyForMastery(0.5, 0.5)).toBe(
        0.5 * (1 - 0.5 * 0.3),
      );
    });
    it('should respect custom adjustment cap', () => {
      expect(service.adjustDifficultyForMastery(0.5, 0.5, 0.5)).toBe(
        0.5 * (1 - 0.5 * 0.5),
      );
    });
  });

  describe('classifyDifficulty', () => {
    it('should classify easy when difficulty < 0.3', () => {
      expect(service.classifyDifficulty(0.2, 0.5)).toBe('easy');
    });
    it('should classify easy when mastery > 0.7', () => {
      expect(service.classifyDifficulty(0.5, 0.8)).toBe('easy');
    });
    it('should classify hard when difficulty > 0.7', () => {
      expect(service.classifyDifficulty(0.8, 0.5)).toBe('hard');
    });
    it('should classify hard when mastery < 0.3', () => {
      expect(service.classifyDifficulty(0.5, 0.2)).toBe('hard');
    });
    it('should classify medium otherwise', () => {
      expect(service.classifyDifficulty(0.5, 0.5)).toBe('medium');
      expect(service.classifyDifficulty(0.3, 0.5)).toBe('medium');
      expect(service.classifyDifficulty(0.7, 0.5)).toBe('medium');
    });
  });
});

describe('classifyDifficulty (standalone)', () => {
  it('should match service classification logic', () => {
    expect(classifyDifficulty(0.2, 0.5)).toBe('easy');
    expect(classifyDifficulty(0.5, 0.8)).toBe('easy');
    expect(classifyDifficulty(0.8, 0.5)).toBe('hard');
    expect(classifyDifficulty(0.5, 0.2)).toBe('hard');
    expect(classifyDifficulty(0.5, 0.5)).toBe('medium');
  });
});
