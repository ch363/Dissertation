import { estimateReviewMinutes } from '../estimateReviewMinutes';

describe('estimateReviewMinutes', () => {
  it('should return null for zero reviews', () => {
    expect(estimateReviewMinutes(0)).toBeNull();
  });

  it('should estimate 1 minute for 1-3 reviews', () => {
    expect(estimateReviewMinutes(1)).toBe(1);
    expect(estimateReviewMinutes(2)).toBe(1);
    expect(estimateReviewMinutes(3)).toBe(1);
  });

  it('should estimate proportionally for 4-10 reviews', () => {
    expect(estimateReviewMinutes(4)).toBe(1);
    expect(estimateReviewMinutes(7)).toBe(2);
    expect(estimateReviewMinutes(10)).toBe(3);
  });

  it('should estimate for large review counts', () => {
    expect(estimateReviewMinutes(20)).toBe(6);
    expect(estimateReviewMinutes(50)).toBe(15);
  });

  it('should cap at reasonable maximum', () => {
    const result = estimateReviewMinutes(1000);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1000); // Should be capped/scaled
  });
});
