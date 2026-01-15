import { CardKind, SessionKind, SessionPlan } from '@/types/session';

const demoTeachCard = {
  id: 'teach-1',
  kind: CardKind.Teach as const,
  prompt: 'New phrase',
  content: {
    phrase: 'Buongiorno',
    translation: 'Good morning',
  },
};

const demoMcqCard = {
  id: 'mcq-1',
  kind: CardKind.MultipleChoice as const,
  prompt: 'How do you say “Thank you”?',
  options: [
    { id: 'a', label: 'Grazie' },
    { id: 'b', label: 'Prego' },
    { id: 'c', label: 'Ciao' },
  ],
  correctOptionId: 'a',
  explanation: '“Grazie” is thank you; “Prego” is you’re welcome.',
};

const demoFillBlankCard = {
  id: 'fill-1',
  kind: CardKind.FillBlank as const,
  prompt: 'Fill in the missing word',
  text: '___ sera (good evening)',
  answer: 'Buona',
  hint: 'Starts with B',
};

export function buildLessonSessionPlan(lessonId: string): SessionPlan {
  return {
    id: `lesson-${lessonId}`,
    kind: 'learn',
    lessonId,
    title: `Lesson ${lessonId}`,
    cards: [demoTeachCard, demoMcqCard, demoFillBlankCard],
  };
}


export function makeSessionId(prefix: SessionKind | 'session' = 'session') {
  return `${prefix}-${Date.now()}`;
}
