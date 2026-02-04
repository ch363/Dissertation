import { buildPrimaryAction } from '../buildPrimaryAction';

describe('buildPrimaryAction', () => {
  it('should return review action when reviews are due', () => {
    const result = buildPrimaryAction(
      {
        kind: 'review',
        dueReviewCount: 10,
        statusMessage: 'You have 10 reviews due today',
      },
      10,
      null,
      5,
    );

    expect(result.kind).toBe('review');
    expect(result.kind === 'review' && result.dueCount).toBe(10);
    expect(result.kind === 'review' && result.estimatedReviewMinutes).toBe(5);
  });

  it('should return continue action for in-progress lesson', () => {
    const result = buildPrimaryAction(
      {
        kind: 'continue',
        lessonId: 'test-id',
        lessonTitle: 'Test Lesson',
        moduleTitle: 'Test Module',
        completedTeachings: 5,
        totalTeachings: 15,
        estTime: '10 min',
        statusMessage: 'Pick up where you left off',
      },
      0,
      15,
      null,
    );

    expect(result.kind).toBe('continue');
    expect(result.kind === 'continue' && result.detailLine).toBeDefined();
  });

  it('should return startNext action for new lesson', () => {
    const result = buildPrimaryAction(
      {
        kind: 'startNext',
        lessonId: 'lesson-1',
        lessonTitle: 'Lesson 1',
        moduleTitle: 'Module A',
        statusMessage: "You're all caught up",
      },
      0,
      20,
      null,
    );

    expect(result.kind).toBe('startNext');
    expect(result.label).toBeDefined();
  });

  it('should prioritize review over continue', () => {
    const result = buildPrimaryAction(
      {
        kind: 'review',
        dueReviewCount: 10,
        statusMessage: 'You have 10 reviews due today',
      },
      10,
      15,
      5,
    );

    expect(result.kind).toBe('review');
  });

  it('should return startNext when no next action (explore)', () => {
    const result = buildPrimaryAction(null, 0, null, null);

    expect(result.kind).toBe('startNext');
    expect(result.label).toBe('Start Next Lesson');
    expect(result.subtitle).toBe('Loading your next step…');
  });
});
