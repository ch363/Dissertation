import {
  calculateItemCount,
  interleaveItems,
  selectModality,
  groupByTopic,
  estimateTime,
  planTeachThenTest,
  getDefaultTimeAverages,
  mixByDeliveryMethod,
} from './content-delivery.policy';
import { DELIVERY_METHOD } from '@prisma/client';
import { DeliveryCandidate } from './types';
import { UserTimeAverages } from './session-types';

describe('Content Delivery Policy', () => {
  describe('calculateItemCount', () => {
    it('should calculate item count from time budget', () => {
      expect(calculateItemCount(300, 60)).toBe(4); // 300s / 60s = 5, with 20% buffer = 4
      expect(calculateItemCount(600, 30)).toBe(16); // 600s / 30s = 20, with 20% buffer = 16
      expect(calculateItemCount(900, 45)).toBe(16); // 900s / 45s = 20, with 20% buffer = 16
    });

    it('should return at least 1 item', () => {
      expect(calculateItemCount(10, 100)).toBe(1);
    });

    it('should cap at 50 items', () => {
      expect(calculateItemCount(10000, 10)).toBe(50);
    });

    it('should use default fallback for invalid avgTime', () => {
      expect(calculateItemCount(300, 0)).toBe(10);
      expect(calculateItemCount(300, -10)).toBe(10);
    });
  });

  describe('interleaveItems', () => {
    interface TestItem {
      id: string;
      group: string;
    }

    it('should interleave items across groups', () => {
      const items: TestItem[] = [
        { id: '1', group: 'A' },
        { id: '2', group: 'A' },
        { id: '3', group: 'B' },
        { id: '4', group: 'B' },
        { id: '5', group: 'C' },
      ];

      const result = interleaveItems(items, (item) => item.group);

      // Should alternate between groups
      expect(result[0].group).toBe('A');
      expect(result[1].group).toBe('B');
      expect(result[2].group).toBe('C');
      expect(result[3].group).toBe('A');
      expect(result[4].group).toBe('B');
    });

    it('should handle single group', () => {
      const items: TestItem[] = [
        { id: '1', group: 'A' },
        { id: '2', group: 'A' },
      ];

      const result = interleaveItems(items, (item) => item.group);
      expect(result.length).toBe(2);
      expect(result[0].group).toBe('A');
      expect(result[1].group).toBe('A');
    });

    it('should handle empty array', () => {
      const result = interleaveItems<TestItem>([], (item) => item.group);
      expect(result.length).toBe(0);
    });
  });

  describe('selectModality', () => {
    const availableMethods = [
      DELIVERY_METHOD.FLASHCARD,
      DELIVERY_METHOD.MULTIPLE_CHOICE,
      DELIVERY_METHOD.FILL_BLANK,
    ];

    it('should favor method with highest preference (weighted selection)', () => {
      const preferences = new Map([
        [DELIVERY_METHOD.FLASHCARD, 0.9],
        [DELIVERY_METHOD.MULTIPLE_CHOICE, 0.5],
        [DELIVERY_METHOD.FILL_BLANK, 0.3],
      ]);

      const candidate: DeliveryCandidate = {
        kind: 'question',
        id: '1',
        questionId: '1',
        dueScore: 0,
        errorScore: 0,
        timeSinceLastSeen: 0,
        deliveryMethods: availableMethods,
      };

      const selections: (DELIVERY_METHOD | undefined)[] = [];
      for (let i = 0; i < 30; i++) {
        selections.push(
          selectModality(candidate, availableMethods, preferences),
        );
      }
      const flashcardCount = selections.filter(
        (m) => m === DELIVERY_METHOD.FLASHCARD,
      ).length;
      expect(flashcardCount).toBeGreaterThan(15); // Best method selected most of the time
    });

    it('should use default preference if method not in preferences', () => {
      const preferences = new Map();
      const candidate: DeliveryCandidate = {
        kind: 'question',
        id: '1',
        questionId: '1',
        dueScore: 0,
        errorScore: 0,
        timeSinceLastSeen: 0,
        deliveryMethods: availableMethods,
      };

      const result = selectModality(candidate, availableMethods, preferences);
      expect(result).toBeDefined();
      expect(availableMethods).toContain(result);
    });

    it('should favor best-performing methods even when used recently', () => {
      const preferences = new Map([
        [DELIVERY_METHOD.FLASHCARD, 0.9], // User performs best on flashcards
        [DELIVERY_METHOD.MULTIPLE_CHOICE, 0.5], // Lower performance
      ]);

      const candidate: DeliveryCandidate = {
        kind: 'question',
        id: '1',
        questionId: '1',
        dueScore: 0,
        errorScore: 0,
        timeSinceLastSeen: 0,
        deliveryMethods: [
          DELIVERY_METHOD.FLASHCARD,
          DELIVERY_METHOD.MULTIPLE_CHOICE,
        ],
      };

      // Run multiple selections to verify best method is favored
      const selections: DELIVERY_METHOD[] = [];
      for (let i = 0; i < 20; i++) {
        const result = selectModality(
          candidate,
          candidate.deliveryMethods!,
          preferences,
          {
            recentMethods: selections.slice(-5), // Track recent methods
            avoidRepetition: true, // This flag is now ignored - we favor performance
          },
        );
        selections.push(result!);
      }

      // FLASHCARD should be selected most of the time (at least 70% due to weighted selection)
      const flashcardCount = selections.filter(
        (m) => m === DELIVERY_METHOD.FLASHCARD,
      ).length;
      expect(flashcardCount).toBeGreaterThan(14); // At least 15 out of 20 (75%)
    });

    it('should return undefined for empty available methods', () => {
      const candidate: DeliveryCandidate = {
        kind: 'question',
        id: '1',
        questionId: '1',
        dueScore: 0,
        errorScore: 0,
        timeSinceLastSeen: 0,
        deliveryMethods: [],
      };

      const result = selectModality(candidate, [], new Map());
      expect(result).toBeUndefined();
    });
  });

  describe('groupByTopic', () => {
    it('should group items by teachingId', () => {
      const items: DeliveryCandidate[] = [
        {
          kind: 'question',
          id: '1',
          questionId: '1',
          teachingId: 'teaching-1',
          dueScore: 0,
          errorScore: 0,
          timeSinceLastSeen: 0,
        },
        {
          kind: 'question',
          id: '2',
          questionId: '2',
          teachingId: 'teaching-1',
          dueScore: 0,
          errorScore: 0,
          timeSinceLastSeen: 0,
        },
        {
          kind: 'question',
          id: '3',
          questionId: '3',
          teachingId: 'teaching-2',
          dueScore: 0,
          errorScore: 0,
          timeSinceLastSeen: 0,
        },
      ];

      const groups = groupByTopic(items);
      expect(groups.size).toBe(2);
      expect(groups.get('teaching-1')?.length).toBe(2);
      expect(groups.get('teaching-2')?.length).toBe(1);
    });

    it('should fallback to lessonId if teachingId not available', () => {
      const items: DeliveryCandidate[] = [
        {
          kind: 'question',
          id: '1',
          questionId: '1',
          lessonId: 'lesson-1',
          dueScore: 0,
          errorScore: 0,
          timeSinceLastSeen: 0,
        },
      ];

      const groups = groupByTopic(items);
      expect(groups.get('lesson-1')?.length).toBe(1);
    });
  });

  describe('estimateTime', () => {
    const userHistory: UserTimeAverages = {
      avgTimePerTeachSec: 30,
      avgTimePerPracticeSec: 60,
      avgTimeByDeliveryMethod: new Map([
        [DELIVERY_METHOD.FLASHCARD, 20],
        [DELIVERY_METHOD.MULTIPLE_CHOICE, 30],
      ]),
      avgTimeByQuestionType: new Map(),
    };

    it('should estimate time for teaching', () => {
      const candidate: DeliveryCandidate = {
        kind: 'teaching',
        id: '1',
        teachingId: '1',
        dueScore: 0,
        errorScore: 0,
        timeSinceLastSeen: 0,
      };

      const result = estimateTime(candidate, userHistory);
      expect(result).toBe(30);
    });

    it('should estimate time for practice with delivery method', () => {
      const candidate: DeliveryCandidate = {
        kind: 'question',
        id: '1',
        questionId: '1',
        dueScore: 0,
        errorScore: 0,
        timeSinceLastSeen: 0,
      };

      const result = estimateTime(
        candidate,
        userHistory,
        DELIVERY_METHOD.FLASHCARD,
      );
      expect(result).toBe(20);
    });

    it('should fallback to practice average if method not in history', () => {
      const candidate: DeliveryCandidate = {
        kind: 'question',
        id: '1',
        questionId: '1',
        dueScore: 0,
        errorScore: 0,
        timeSinceLastSeen: 0,
      };

      const result = estimateTime(
        candidate,
        userHistory,
        DELIVERY_METHOD.TEXT_TRANSLATION,
      );
      expect(result).toBe(60);
    });
  });

  describe('planTeachThenTest', () => {
    it('should arrange teachings before their questions', () => {
      const teachings: DeliveryCandidate[] = [
        {
          kind: 'teaching',
          id: 'teaching-1',
          teachingId: 'teaching-1',
          dueScore: 0,
          errorScore: 0,
          timeSinceLastSeen: 0,
        },
      ];

      const questions: DeliveryCandidate[] = [
        {
          kind: 'question',
          id: 'question-1',
          questionId: 'question-1',
          teachingId: 'teaching-1',
          dueScore: 0,
          errorScore: 0,
          timeSinceLastSeen: 0,
        },
      ];

      const seenTeachingIds = new Set<string>();
      const result = planTeachThenTest(teachings, questions, seenTeachingIds);

      expect(result.length).toBe(2);
      expect(result[0].kind).toBe('teaching');
      expect(result[1].kind).toBe('question');
    });

    it('should skip teaching if already seen', () => {
      const teachings: DeliveryCandidate[] = [
        {
          kind: 'teaching',
          id: 'teaching-1',
          teachingId: 'teaching-1',
          dueScore: 0,
          errorScore: 0,
          timeSinceLastSeen: 0,
        },
      ];

      const questions: DeliveryCandidate[] = [
        {
          kind: 'question',
          id: 'question-1',
          questionId: 'question-1',
          teachingId: 'teaching-1',
          dueScore: 0,
          errorScore: 0,
          timeSinceLastSeen: 0,
        },
      ];

      const seenTeachingIds = new Set(['teaching-1']);
      const result = planTeachThenTest(teachings, questions, seenTeachingIds);

      expect(result.length).toBe(1);
      expect(result[0].kind).toBe('question');
    });

    it('should handle questions without teachings', () => {
      const teachings: DeliveryCandidate[] = [];
      const questions: DeliveryCandidate[] = [
        {
          kind: 'question',
          id: 'question-1',
          questionId: 'question-1',
          dueScore: 0,
          errorScore: 0,
          timeSinceLastSeen: 0,
        },
      ];

      const result = planTeachThenTest(teachings, questions, new Set());
      expect(result.length).toBe(1);
      expect(result[0].kind).toBe('question');
    });
  });

  describe('getDefaultTimeAverages', () => {
    it('should return default time averages', () => {
      const result = getDefaultTimeAverages();
      expect(result.avgTimePerTeachSec).toBe(30);
      expect(result.avgTimePerPracticeSec).toBe(60);
      expect(result.avgTimeByDeliveryMethod.size).toBeGreaterThan(0);
    });
  });

  describe('mixByDeliveryMethod', () => {
    it('should mix items by delivery method', () => {
      const items: DeliveryCandidate[] = [
        {
          kind: 'question',
          id: '1',
          questionId: '1',
          dueScore: 0,
          errorScore: 0,
          timeSinceLastSeen: 0,
          deliveryMethods: [DELIVERY_METHOD.FLASHCARD],
        },
        {
          kind: 'question',
          id: '2',
          questionId: '2',
          dueScore: 0,
          errorScore: 0,
          timeSinceLastSeen: 0,
          deliveryMethods: [DELIVERY_METHOD.FLASHCARD],
        },
        {
          kind: 'question',
          id: '3',
          questionId: '3',
          dueScore: 0,
          errorScore: 0,
          timeSinceLastSeen: 0,
          deliveryMethods: [DELIVERY_METHOD.MULTIPLE_CHOICE],
        },
        {
          kind: 'question',
          id: '4',
          questionId: '4',
          dueScore: 0,
          errorScore: 0,
          timeSinceLastSeen: 0,
          deliveryMethods: [DELIVERY_METHOD.MULTIPLE_CHOICE],
        },
      ];

      const result = mixByDeliveryMethod(items);
      expect(result.length).toBe(4);
      // Should interleave methods
      expect(result[0].deliveryMethods?.[0]).toBe(DELIVERY_METHOD.FLASHCARD);
      expect(result[1].deliveryMethods?.[0]).toBe(
        DELIVERY_METHOD.MULTIPLE_CHOICE,
      );
      expect(result[2].deliveryMethods?.[0]).toBe(DELIVERY_METHOD.FLASHCARD);
      expect(result[3].deliveryMethods?.[0]).toBe(
        DELIVERY_METHOD.MULTIPLE_CHOICE,
      );
    });

    it('should handle items without delivery methods', () => {
      const items: DeliveryCandidate[] = [
        {
          kind: 'question',
          id: '1',
          questionId: '1',
          dueScore: 0,
          errorScore: 0,
          timeSinceLastSeen: 0,
        },
      ];

      const result = mixByDeliveryMethod(items);
      expect(result.length).toBe(1);
    });
  });
});
