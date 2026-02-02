import { buildPrimaryAction } from './buildPrimaryAction';

describe('buildPrimaryAction', () => {
  it('should return review action when reviews are due', () => {
    const result = buildPrimaryAction({
      dueReviewCount: 10,
      estimatedReviewMinutes: 5,
      nextLessonItemCount: null,
    });

    expect(result.type).toBe('review');
    expect(result.itemCount).toBe(10);
    expect(result.estimatedMinutes).toBe(5);
  });

  it('should return continue action for in-progress lesson', () => {
    const result = buildPrimaryAction({
      dueReviewCount: 0,
      estimatedReviewMinutes: null,
      nextLessonItemCount: 15,
      inProgressLesson: {
        lessonId: 'test-id',
        lessonTitle: 'Test Lesson',
        moduleTitle: 'Test Module',
        completedTeachings: 5,
        totalTeachings: 15,
        estTime: '10 min',
      },
    });

    expect(result.type).toBe('continue');
    expect(result.itemCount).toBe(15);
  });

  it('should return start action for new lesson', () => {
    const result = buildPrimaryAction({
      dueReviewCount: 0,
      estimatedReviewMinutes: null,
      nextLessonItemCount: 20,
    });

    expect(result.type).toBe('start');
    expect(result.itemCount).toBe(20);
  });

  it('should prioritize review over continue', () => {
    const result = buildPrimaryAction({
      dueReviewCount: 10,
      estimatedReviewMinutes: 5,
      nextLessonItemCount: 15,
      inProgressLesson: {
        lessonId: 'test-id',
        lessonTitle: 'Test Lesson',
        moduleTitle: 'Test Module',
        completedTeachings: 5,
        totalTeachings: 15,
        estTime: '10 min',
      },
    });

    expect(result.type).toBe('review');
  });

  it('should return explore action when no other actions available', () => {
    const result = buildPrimaryAction({
      dueReviewCount: 0,
      estimatedReviewMinutes: null,
      nextLessonItemCount: null,
    });

    expect(result.type).toBe('explore');
  });
});
