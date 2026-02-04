import { estimateReviewMinutes } from '../estimateReviewMinutes';

describe('estimateReviewMinutes', () => {
  it('should return 0 for zero reviews', () => {
    expect(estimateReviewMinutes(0)).toBe(0);
  });

  it('should clamp to minimum 3 minutes for 1-6 reviews', () => {
    expect(estimateReviewMinutes(1)).toBe(3);
    expect(estimateReviewMinutes(2)).toBe(3);
    expect(estimateReviewMinutes(3)).toBe(3);
    expect(estimateReviewMinutes(4)).toBe(3);
    expect(estimateReviewMinutes(6)).toBe(3);
  });

  it('should estimate proportionally for 7+ reviews', () => {
    expect(estimateReviewMinutes(7)).toBe(4);
    expect(estimateReviewMinutes(10)).toBe(5);
    expect(estimateReviewMinutes(20)).toBe(10);
  });

  it('should cap at 15 minutes maximum', () => {
    expect(estimateReviewMinutes(50)).toBe(15);
    expect(estimateReviewMinutes(100)).toBe(15);
  });

  it('should cap at reasonable maximum for very large counts', () => {
    const result = estimateReviewMinutes(1000);
    expect(result).toBe(15);
  });
});
