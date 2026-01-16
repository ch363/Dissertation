// JavaScript version of seed script to avoid TypeScript/ts-node issues
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

// Verify DATABASE_URL is set before importing PrismaClient
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL is not set');
  console.error('   Please set DATABASE_URL in your .env file or environment variables');
  process.exit(1);
}

// Import PrismaClient and adapter after ensuring DATABASE_URL is set
const { PrismaClient, KNOWLEDGE_LEVEL, DELIVERY_METHOD } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// Create PrismaClient with adapter (required for this Prisma setup)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: true }
    : { rejectUnauthorized: false }, // Allow self-signed certs in development (for Supabase)
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Deterministic UUIDs for seed data (idempotent seeding)
const SEED_UUIDS = {
  module: '00000000-0000-0000-0000-000000000001',
  lesson: '00000000-0000-0000-0000-000000000002',
  lessonNumbers: '00000000-0000-0000-0000-000000000003',
  lessonCommonPhrases: '00000000-0000-0000-0000-000000000004',
  lessonDaysOfWeek: '00000000-0000-0000-0000-000000000005',
  lessonColors: '00000000-0000-0000-0000-000000000006',
  teachingCiao: '00000000-0000-0000-0000-000000000010',
  teachingGrazie: '00000000-0000-0000-0000-000000000011',
  teachingPerFavore: '00000000-0000-0000-0000-000000000012',
  teachingUno: '00000000-0000-0000-0000-000000000013',
  teachingDue: '00000000-0000-0000-0000-000000000014',
  teachingTre: '00000000-0000-0000-0000-000000000015',
  teachingScusa: '00000000-0000-0000-0000-000000000016',
  teachingPrego: '00000000-0000-0000-0000-000000000017',
  teachingBuongiorno: '00000000-0000-0000-0000-000000000018',
  teachingLunedì: '00000000-0000-0000-0000-000000000019',
  teachingMartedì: '00000000-0000-0000-0000-00000000001a',
  teachingMercoledì: '00000000-0000-0000-0000-00000000001b',
  teachingRosso: '00000000-0000-0000-0000-00000000001c',
  teachingBlu: '00000000-0000-0000-0000-00000000001d',
  teachingVerde: '00000000-0000-0000-0000-00000000001e',
  questionCiaoMultipleChoice: '00000000-0000-0000-0000-000000000020',
  questionCiaoTranslation: '00000000-0000-0000-0000-000000000021',
  questionGrazieMultipleChoice: '00000000-0000-0000-0000-000000000022',
  questionGrazieFillBlank: '00000000-0000-0000-0000-000000000023',
  questionPerFavoreTranslation: '00000000-0000-0000-0000-000000000024',
  questionCiaoListening: '00000000-0000-0000-0000-000000000025',
  questionGrazieFlashcard: '00000000-0000-0000-0000-000000000026',
  questionPerFavoreTextToSpeech: '00000000-0000-0000-0000-000000000027',
  questionUnoMultipleChoice: '00000000-0000-0000-0000-000000000028',
  questionDueTranslation: '00000000-0000-0000-0000-000000000029',
  questionTreFlashcard: '00000000-0000-0000-0000-00000000002a',
  questionScusaMultipleChoice: '00000000-0000-0000-0000-00000000002b',
  questionPregoTranslation: '00000000-0000-0000-0000-00000000002c',
  questionBuongiornoSpeechToText: '00000000-0000-0000-0000-00000000002d',
  questionLunedìMultipleChoice: '00000000-0000-0000-0000-00000000002e',
  questionMartedìTranslation: '00000000-0000-0000-0000-00000000002f',
  questionMercoledìFlashcard: '00000000-0000-0000-0000-000000000030',
  questionRossoMultipleChoice: '00000000-0000-0000-0000-000000000031',
  questionBluTranslation: '00000000-0000-0000-0000-000000000032',
  questionVerdeFillBlank: '00000000-0000-0000-0000-000000000033',
};

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Upsert Module
  const module = await prisma.module.upsert({
    where: { id: SEED_UUIDS.module },
    update: {
      title: 'Basics',
      description: 'Essential Italian phrases and greetings for beginners',
      imageUrl: 'https://example.com/images/italian-basics.jpg',
    },
    create: {
      id: SEED_UUIDS.module,
      title: 'Basics',
      description: 'Essential Italian phrases and greetings for beginners',
      imageUrl: 'https://example.com/images/italian-basics.jpg',
    },
  });
  console.log('✅ Module created/updated:', module.title);

  // 2. Upsert Lesson
  const lesson = await prisma.lesson.upsert({
    where: { id: SEED_UUIDS.lesson },
    update: {
      title: 'Greetings & Essentials',
      description: 'Learn basic greetings and essential phrases in Italian',
      imageUrl: 'https://example.com/images/greetings.jpg',
      moduleId: SEED_UUIDS.module,
      numberOfItems: 3,
    },
    create: {
      id: SEED_UUIDS.lesson,
      title: 'Greetings & Essentials',
      description: 'Learn basic greetings and essential phrases in Italian',
      imageUrl: 'https://example.com/images/greetings.jpg',
      moduleId: SEED_UUIDS.module,
      numberOfItems: 3,
    },
  });
  console.log('✅ Lesson created/updated:', lesson.title);

  // 3. Upsert Teaching items
  const teachingCiao = await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingCiao },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '👋',
      userLanguageString: 'Hi / Bye',
      learningLanguageString: 'Ciao',
      tip: 'Ciao is used both for greeting and saying goodbye in informal situations.',
      lessonId: SEED_UUIDS.lesson,
    },
    create: {
      id: SEED_UUIDS.teachingCiao,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '👋',
      userLanguageString: 'Hi / Bye',
      learningLanguageString: 'Ciao',
      tip: 'Ciao is used both for greeting and saying goodbye in informal situations.',
      lessonId: SEED_UUIDS.lesson,
    },
  });
  console.log('✅ Teaching created/updated: Ciao');

  const teachingGrazie = await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingGrazie },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🙏',
      userLanguageString: 'Thank you',
      learningLanguageString: 'Grazie',
      tip: 'Grazie is the standard way to say thank you. You can also say "Grazie mille" (thanks a lot).',
      lessonId: SEED_UUIDS.lesson,
    },
    create: {
      id: SEED_UUIDS.teachingGrazie,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🙏',
      userLanguageString: 'Thank you',
      learningLanguageString: 'Grazie',
      tip: 'Grazie is the standard way to say thank you. You can also say "Grazie mille" (thanks a lot).',
      lessonId: SEED_UUIDS.lesson,
    },
  });
  console.log('✅ Teaching created/updated: Grazie');

  const teachingPerFavore = await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingPerFavore },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🙏',
      userLanguageString: 'Please',
      learningLanguageString: 'Per favore',
      tip: 'Per favore is used when making a request. It literally means "for favor".',
      lessonId: SEED_UUIDS.lesson,
    },
    create: {
      id: SEED_UUIDS.teachingPerFavore,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🙏',
      userLanguageString: 'Please',
      learningLanguageString: 'Per favore',
      tip: 'Per favore is used when making a request. It literally means "for favor".',
      lessonId: SEED_UUIDS.lesson,
    },
  });
  console.log('✅ Teaching created/updated: Per favore');

  // 4. Upsert Questions and their delivery method tables
  // Question 1: Ciao - Multiple Choice (EN→IT)
  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionCiaoMultipleChoice },
    update: {
      teachingId: SEED_UUIDS.teachingCiao,
      type: DELIVERY_METHOD.MULTIPLE_CHOICE,
    },
    create: {
      id: SEED_UUIDS.questionCiaoMultipleChoice,
      teachingId: SEED_UUIDS.teachingCiao,
      type: DELIVERY_METHOD.MULTIPLE_CHOICE,
      multipleChoice: {
        create: {
          options: ['Ciao', 'Buongiorno', 'Arrivederci', 'Salve'],
          correctIndices: [0],
        },
      },
    },
  });
  // Update or create the multiple choice data
  await prisma.questionMultipleChoice.upsert({
    where: { questionId: SEED_UUIDS.questionCiaoMultipleChoice },
    update: {
      options: ['Ciao', 'Buongiorno', 'Arrivederci', 'Salve'],
      correctIndices: [0],
    },
    create: {
      questionId: SEED_UUIDS.questionCiaoMultipleChoice,
      options: ['Ciao', 'Buongiorno', 'Arrivederci', 'Salve'],
      correctIndices: [0],
    },
  });
  console.log('✅ Question created/updated: Ciao (Multiple Choice)');

  // Question 2: Ciao - Translation (IT→EN)
  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionCiaoTranslation },
    update: {
      teachingId: SEED_UUIDS.teachingCiao,
      type: DELIVERY_METHOD.TEXT_TRANSLATION,
    },
    create: {
      id: SEED_UUIDS.questionCiaoTranslation,
      teachingId: SEED_UUIDS.teachingCiao,
      type: DELIVERY_METHOD.TEXT_TRANSLATION,
      textTranslation: {
        create: {
          acceptedAnswers: ['Hi', 'Bye', 'Hello', 'Goodbye'],
        },
      },
    },
  });
  await prisma.questionTextTranslation.upsert({
    where: { questionId: SEED_UUIDS.questionCiaoTranslation },
    update: {
      acceptedAnswers: ['Hi', 'Bye', 'Hello', 'Goodbye'],
    },
    create: {
      questionId: SEED_UUIDS.questionCiaoTranslation,
      acceptedAnswers: ['Hi', 'Bye', 'Hello', 'Goodbye'],
    },
  });
  console.log('✅ Question created/updated: Ciao (Translation)');

  // Question 3: Ciao - Listening (Speech to Text)
  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionCiaoListening },
    update: {
      teachingId: SEED_UUIDS.teachingCiao,
      type: DELIVERY_METHOD.SPEECH_TO_TEXT,
    },
    create: {
      id: SEED_UUIDS.questionCiaoListening,
      teachingId: SEED_UUIDS.teachingCiao,
      type: DELIVERY_METHOD.SPEECH_TO_TEXT,
      speechToText: {
        create: {
          acceptedAnswers: ['Ciao', 'ciao'],
        },
      },
    },
  });
  await prisma.questionSpeechToText.upsert({
    where: { questionId: SEED_UUIDS.questionCiaoListening },
    update: {
      acceptedAnswers: ['Ciao', 'ciao'],
    },
    create: {
      questionId: SEED_UUIDS.questionCiaoListening,
      acceptedAnswers: ['Ciao', 'ciao'],
    },
  });
  console.log('✅ Question created/updated: Ciao (Listening)');

  // Question 4: Grazie - Multiple Choice (EN→IT)
  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionGrazieMultipleChoice },
    update: {
      teachingId: SEED_UUIDS.teachingGrazie,
      type: DELIVERY_METHOD.MULTIPLE_CHOICE,
    },
    create: {
      id: SEED_UUIDS.questionGrazieMultipleChoice,
      teachingId: SEED_UUIDS.teachingGrazie,
      type: DELIVERY_METHOD.MULTIPLE_CHOICE,
      multipleChoice: {
        create: {
          options: ['Grazie', 'Prego', 'Scusa', 'Per favore'],
          correctIndices: [0],
        },
      },
    },
  });
  await prisma.questionMultipleChoice.upsert({
    where: { questionId: SEED_UUIDS.questionGrazieMultipleChoice },
    update: {
      options: ['Grazie', 'Prego', 'Scusa', 'Per favore'],
      correctIndices: [0],
    },
    create: {
      questionId: SEED_UUIDS.questionGrazieMultipleChoice,
      options: ['Grazie', 'Prego', 'Scusa', 'Per favore'],
      correctIndices: [0],
    },
  });
  console.log('✅ Question created/updated: Grazie (Multiple Choice)');

  // Question 5: Grazie - Fill in the Blank
  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionGrazieFillBlank },
    update: {
      teachingId: SEED_UUIDS.teachingGrazie,
      type: DELIVERY_METHOD.FILL_BLANK,
    },
    create: {
      id: SEED_UUIDS.questionGrazieFillBlank,
      teachingId: SEED_UUIDS.teachingGrazie,
      type: DELIVERY_METHOD.FILL_BLANK,
      fillBlank: {
        create: {
          blankIndices: [0],
          acceptedAnswers: { '0': ['Grazie'] },
        },
      },
    },
  });
  await prisma.questionFillBlank.upsert({
    where: { questionId: SEED_UUIDS.questionGrazieFillBlank },
    update: {
      blankIndices: [0],
      acceptedAnswers: { '0': ['Grazie'] },
    },
    create: {
      questionId: SEED_UUIDS.questionGrazieFillBlank,
      blankIndices: [0],
      acceptedAnswers: { '0': ['Grazie'] },
    },
  });
  console.log('✅ Question created/updated: Grazie (Fill Blank)');

  // Question 6: Per favore - Translation (EN→IT)
  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionPerFavoreTranslation },
    update: {
      teachingId: SEED_UUIDS.teachingPerFavore,
      type: DELIVERY_METHOD.TEXT_TRANSLATION,
    },
    create: {
      id: SEED_UUIDS.questionPerFavoreTranslation,
      teachingId: SEED_UUIDS.teachingPerFavore,
      type: DELIVERY_METHOD.TEXT_TRANSLATION,
      textTranslation: {
        create: {
          acceptedAnswers: ['Please', 'please'],
        },
      },
    },
  });
  await prisma.questionTextTranslation.upsert({
    where: { questionId: SEED_UUIDS.questionPerFavoreTranslation },
    update: {
      acceptedAnswers: ['Please', 'please'],
    },
    create: {
      questionId: SEED_UUIDS.questionPerFavoreTranslation,
      acceptedAnswers: ['Please', 'please'],
    },
  });
  console.log('✅ Question created/updated: Per favore (Translation)');

  // Question 7: Grazie - Flashcard
  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionGrazieFlashcard },
    update: {
      teachingId: SEED_UUIDS.teachingGrazie,
      type: DELIVERY_METHOD.FLASHCARD,
    },
    create: {
      id: SEED_UUIDS.questionGrazieFlashcard,
      teachingId: SEED_UUIDS.teachingGrazie,
      type: DELIVERY_METHOD.FLASHCARD,
      flashcard: {
        create: {},
      },
    },
  });
  await prisma.questionFlashcard.upsert({
    where: { questionId: SEED_UUIDS.questionGrazieFlashcard },
    update: {},
    create: {
      questionId: SEED_UUIDS.questionGrazieFlashcard,
    },
  });
  console.log('✅ Question created/updated: Grazie (Flashcard)');

  // Question 8: Per favore - Text to Speech
  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionPerFavoreTextToSpeech },
    update: {
      teachingId: SEED_UUIDS.teachingPerFavore,
      type: DELIVERY_METHOD.TEXT_TO_SPEECH,
    },
    create: {
      id: SEED_UUIDS.questionPerFavoreTextToSpeech,
      teachingId: SEED_UUIDS.teachingPerFavore,
      type: DELIVERY_METHOD.TEXT_TO_SPEECH,
      textToSpeech: {
        create: {},
      },
    },
  });
  await prisma.questionTextToSpeech.upsert({
    where: { questionId: SEED_UUIDS.questionPerFavoreTextToSpeech },
    update: {},
    create: {
      questionId: SEED_UUIDS.questionPerFavoreTextToSpeech,
    },
  });
  console.log('✅ Question created/updated: Per favore (Text to Speech)');

  // ========== NEW LESSONS ==========
  
  // Lesson 2: Numbers
  const lessonNumbers = await prisma.lesson.upsert({
    where: { id: SEED_UUIDS.lessonNumbers },
    update: {
      title: 'Numbers 1-10',
      description: 'Learn the basic numbers in Italian',
      imageUrl: 'https://example.com/images/numbers.jpg',
      moduleId: SEED_UUIDS.module,
      numberOfItems: 3,
    },
    create: {
      id: SEED_UUIDS.lessonNumbers,
      title: 'Numbers 1-10',
      description: 'Learn the basic numbers in Italian',
      imageUrl: 'https://example.com/images/numbers.jpg',
      moduleId: SEED_UUIDS.module,
      numberOfItems: 3,
    },
  });
  console.log('✅ Lesson created/updated:', lessonNumbers.title);

  const teachingUno = await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingUno },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '1️⃣',
      userLanguageString: 'One',
      learningLanguageString: 'Uno',
      tip: 'Uno is used for masculine nouns. For feminine nouns, use "una".',
      lessonId: SEED_UUIDS.lessonNumbers,
    },
    create: {
      id: SEED_UUIDS.teachingUno,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '1️⃣',
      userLanguageString: 'One',
      learningLanguageString: 'Uno',
      tip: 'Uno is used for masculine nouns. For feminine nouns, use "una".',
      lessonId: SEED_UUIDS.lessonNumbers,
    },
  });
  console.log('✅ Teaching created/updated: Uno');

  const teachingDue = await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingDue },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '2️⃣',
      userLanguageString: 'Two',
      learningLanguageString: 'Due',
      tip: 'Due is the same for both masculine and feminine nouns.',
      lessonId: SEED_UUIDS.lessonNumbers,
    },
    create: {
      id: SEED_UUIDS.teachingDue,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '2️⃣',
      userLanguageString: 'Two',
      learningLanguageString: 'Due',
      tip: 'Due is the same for both masculine and feminine nouns.',
      lessonId: SEED_UUIDS.lessonNumbers,
    },
  });
  console.log('✅ Teaching created/updated: Due');

  const teachingTre = await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingTre },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '3️⃣',
      userLanguageString: 'Three',
      learningLanguageString: 'Tre',
      tip: 'Tre is also the same for both masculine and feminine nouns.',
      lessonId: SEED_UUIDS.lessonNumbers,
    },
    create: {
      id: SEED_UUIDS.teachingTre,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '3️⃣',
      userLanguageString: 'Three',
      learningLanguageString: 'Tre',
      tip: 'Tre is also the same for both masculine and feminine nouns.',
      lessonId: SEED_UUIDS.lessonNumbers,
    },
  });
  console.log('✅ Teaching created/updated: Tre');

  // Questions for Numbers
  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionUnoMultipleChoice },
    update: {
      teachingId: SEED_UUIDS.teachingUno,
      type: DELIVERY_METHOD.MULTIPLE_CHOICE,
    },
    create: {
      id: SEED_UUIDS.questionUnoMultipleChoice,
      teachingId: SEED_UUIDS.teachingUno,
      type: DELIVERY_METHOD.MULTIPLE_CHOICE,
      multipleChoice: {
        create: {
          options: ['Uno', 'Due', 'Tre', 'Quattro'],
          correctIndices: [0],
        },
      },
    },
  });
  await prisma.questionMultipleChoice.upsert({
    where: { questionId: SEED_UUIDS.questionUnoMultipleChoice },
    update: {
      options: ['Uno', 'Due', 'Tre', 'Quattro'],
      correctIndices: [0],
    },
    create: {
      questionId: SEED_UUIDS.questionUnoMultipleChoice,
      options: ['Uno', 'Due', 'Tre', 'Quattro'],
      correctIndices: [0],
    },
  });
  console.log('✅ Question created/updated: Uno (Multiple Choice)');

  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionDueTranslation },
    update: {
      teachingId: SEED_UUIDS.teachingDue,
      type: DELIVERY_METHOD.TEXT_TRANSLATION,
    },
    create: {
      id: SEED_UUIDS.questionDueTranslation,
      teachingId: SEED_UUIDS.teachingDue,
      type: DELIVERY_METHOD.TEXT_TRANSLATION,
      textTranslation: {
        create: {
          acceptedAnswers: ['Two', 'two', '2'],
        },
      },
    },
  });
  await prisma.questionTextTranslation.upsert({
    where: { questionId: SEED_UUIDS.questionDueTranslation },
    update: {
      acceptedAnswers: ['Two', 'two', '2'],
    },
    create: {
      questionId: SEED_UUIDS.questionDueTranslation,
      acceptedAnswers: ['Two', 'two', '2'],
    },
  });
  console.log('✅ Question created/updated: Due (Translation)');

  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionTreFlashcard },
    update: {
      teachingId: SEED_UUIDS.teachingTre,
      type: DELIVERY_METHOD.FLASHCARD,
    },
    create: {
      id: SEED_UUIDS.questionTreFlashcard,
      teachingId: SEED_UUIDS.teachingTre,
      type: DELIVERY_METHOD.FLASHCARD,
      flashcard: {
        create: {},
      },
    },
  });
  await prisma.questionFlashcard.upsert({
    where: { questionId: SEED_UUIDS.questionTreFlashcard },
    update: {},
    create: {
      questionId: SEED_UUIDS.questionTreFlashcard,
    },
  });
  console.log('✅ Question created/updated: Tre (Flashcard)');

  // Lesson 3: Common Phrases
  const lessonCommonPhrases = await prisma.lesson.upsert({
    where: { id: SEED_UUIDS.lessonCommonPhrases },
    update: {
      title: 'Common Phrases',
      description: 'Essential everyday phrases in Italian',
      imageUrl: 'https://example.com/images/common-phrases.jpg',
      moduleId: SEED_UUIDS.module,
      numberOfItems: 3,
    },
    create: {
      id: SEED_UUIDS.lessonCommonPhrases,
      title: 'Common Phrases',
      description: 'Essential everyday phrases in Italian',
      imageUrl: 'https://example.com/images/common-phrases.jpg',
      moduleId: SEED_UUIDS.module,
      numberOfItems: 3,
    },
  });
  console.log('✅ Lesson created/updated:', lessonCommonPhrases.title);

  const teachingScusa = await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingScusa },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🙏',
      userLanguageString: 'Sorry / Excuse me',
      learningLanguageString: 'Scusa',
      tip: 'Scusa is informal. Use "Scusi" for formal situations or when addressing multiple people.',
      lessonId: SEED_UUIDS.lessonCommonPhrases,
    },
    create: {
      id: SEED_UUIDS.teachingScusa,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🙏',
      userLanguageString: 'Sorry / Excuse me',
      learningLanguageString: 'Scusa',
      tip: 'Scusa is informal. Use "Scusi" for formal situations or when addressing multiple people.',
      lessonId: SEED_UUIDS.lessonCommonPhrases,
    },
  });
  console.log('✅ Teaching created/updated: Scusa');

  const teachingPrego = await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingPrego },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🙏',
      userLanguageString: 'You\'re welcome / Please',
      learningLanguageString: 'Prego',
      tip: 'Prego is a versatile word meaning "you\'re welcome", "please", or "go ahead".',
      lessonId: SEED_UUIDS.lessonCommonPhrases,
    },
    create: {
      id: SEED_UUIDS.teachingPrego,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🙏',
      userLanguageString: 'You\'re welcome / Please',
      learningLanguageString: 'Prego',
      tip: 'Prego is a versatile word meaning "you\'re welcome", "please", or "go ahead".',
      lessonId: SEED_UUIDS.lessonCommonPhrases,
    },
  });
  console.log('✅ Teaching created/updated: Prego');

  const teachingBuongiorno = await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingBuongiorno },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🌅',
      userLanguageString: 'Good morning / Good day',
      learningLanguageString: 'Buongiorno',
      tip: 'Buongiorno is used from morning until early afternoon. After that, use "Buonasera" (good evening).',
      lessonId: SEED_UUIDS.lessonCommonPhrases,
    },
    create: {
      id: SEED_UUIDS.teachingBuongiorno,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🌅',
      userLanguageString: 'Good morning / Good day',
      learningLanguageString: 'Buongiorno',
      tip: 'Buongiorno is used from morning until early afternoon. After that, use "Buonasera" (good evening).',
      lessonId: SEED_UUIDS.lessonCommonPhrases,
    },
  });
  console.log('✅ Teaching created/updated: Buongiorno');

  // Questions for Common Phrases
  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionScusaMultipleChoice },
    update: {
      teachingId: SEED_UUIDS.teachingScusa,
      type: DELIVERY_METHOD.MULTIPLE_CHOICE,
    },
    create: {
      id: SEED_UUIDS.questionScusaMultipleChoice,
      teachingId: SEED_UUIDS.teachingScusa,
      type: DELIVERY_METHOD.MULTIPLE_CHOICE,
      multipleChoice: {
        create: {
          options: ['Scusa', 'Prego', 'Grazie', 'Ciao'],
          correctIndices: [0],
        },
      },
    },
  });
  await prisma.questionMultipleChoice.upsert({
    where: { questionId: SEED_UUIDS.questionScusaMultipleChoice },
    update: {
      options: ['Scusa', 'Prego', 'Grazie', 'Ciao'],
      correctIndices: [0],
    },
    create: {
      questionId: SEED_UUIDS.questionScusaMultipleChoice,
      options: ['Scusa', 'Prego', 'Grazie', 'Ciao'],
      correctIndices: [0],
    },
  });
  console.log('✅ Question created/updated: Scusa (Multiple Choice)');

  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionPregoTranslation },
    update: {
      teachingId: SEED_UUIDS.teachingPrego,
      type: DELIVERY_METHOD.TEXT_TRANSLATION,
    },
    create: {
      id: SEED_UUIDS.questionPregoTranslation,
      teachingId: SEED_UUIDS.teachingPrego,
      type: DELIVERY_METHOD.TEXT_TRANSLATION,
      textTranslation: {
        create: {
          acceptedAnswers: ['You\'re welcome', 'you\'re welcome', 'Please', 'please', 'Go ahead'],
        },
      },
    },
  });
  await prisma.questionTextTranslation.upsert({
    where: { questionId: SEED_UUIDS.questionPregoTranslation },
    update: {
      acceptedAnswers: ['You\'re welcome', 'you\'re welcome', 'Please', 'please', 'Go ahead'],
    },
    create: {
      questionId: SEED_UUIDS.questionPregoTranslation,
      acceptedAnswers: ['You\'re welcome', 'you\'re welcome', 'Please', 'please', 'Go ahead'],
    },
  });
  console.log('✅ Question created/updated: Prego (Translation)');

  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionBuongiornoSpeechToText },
    update: {
      teachingId: SEED_UUIDS.teachingBuongiorno,
      type: DELIVERY_METHOD.SPEECH_TO_TEXT,
    },
    create: {
      id: SEED_UUIDS.questionBuongiornoSpeechToText,
      teachingId: SEED_UUIDS.teachingBuongiorno,
      type: DELIVERY_METHOD.SPEECH_TO_TEXT,
      speechToText: {
        create: {
          acceptedAnswers: ['Buongiorno', 'buongiorno'],
        },
      },
    },
  });
  await prisma.questionSpeechToText.upsert({
    where: { questionId: SEED_UUIDS.questionBuongiornoSpeechToText },
    update: {
      acceptedAnswers: ['Buongiorno', 'buongiorno'],
    },
    create: {
      questionId: SEED_UUIDS.questionBuongiornoSpeechToText,
      acceptedAnswers: ['Buongiorno', 'buongiorno'],
    },
  });
  console.log('✅ Question created/updated: Buongiorno (Speech to Text)');

  // Lesson 4: Days of the Week
  const lessonDaysOfWeek = await prisma.lesson.upsert({
    where: { id: SEED_UUIDS.lessonDaysOfWeek },
    update: {
      title: 'Days of the Week',
      description: 'Learn the days of the week in Italian',
      imageUrl: 'https://example.com/images/days-of-week.jpg',
      moduleId: SEED_UUIDS.module,
      numberOfItems: 3,
    },
    create: {
      id: SEED_UUIDS.lessonDaysOfWeek,
      title: 'Days of the Week',
      description: 'Learn the days of the week in Italian',
      imageUrl: 'https://example.com/images/days-of-week.jpg',
      moduleId: SEED_UUIDS.module,
      numberOfItems: 3,
    },
  });
  console.log('✅ Lesson created/updated:', lessonDaysOfWeek.title);

  const teachingLunedì = await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingLunedì },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '📅',
      userLanguageString: 'Monday',
      learningLanguageString: 'Lunedì',
      tip: 'In Italian, days of the week are not capitalized unless they start a sentence.',
      lessonId: SEED_UUIDS.lessonDaysOfWeek,
    },
    create: {
      id: SEED_UUIDS.teachingLunedì,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '📅',
      userLanguageString: 'Monday',
      learningLanguageString: 'Lunedì',
      tip: 'In Italian, days of the week are not capitalized unless they start a sentence.',
      lessonId: SEED_UUIDS.lessonDaysOfWeek,
    },
  });
  console.log('✅ Teaching created/updated: Lunedì');

  const teachingMartedì = await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingMartedì },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '📅',
      userLanguageString: 'Tuesday',
      learningLanguageString: 'Martedì',
      tip: 'Martedì comes from "Marte" (Mars), the Roman god of war.',
      lessonId: SEED_UUIDS.lessonDaysOfWeek,
    },
    create: {
      id: SEED_UUIDS.teachingMartedì,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '📅',
      userLanguageString: 'Tuesday',
      learningLanguageString: 'Martedì',
      tip: 'Martedì comes from "Marte" (Mars), the Roman god of war.',
      lessonId: SEED_UUIDS.lessonDaysOfWeek,
    },
  });
  console.log('✅ Teaching created/updated: Martedì');

  const teachingMercoledì = await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingMercoledì },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '📅',
      userLanguageString: 'Wednesday',
      learningLanguageString: 'Mercoledì',
      tip: 'Mercoledì comes from "Mercurio" (Mercury), the messenger god.',
      lessonId: SEED_UUIDS.lessonDaysOfWeek,
    },
    create: {
      id: SEED_UUIDS.teachingMercoledì,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '📅',
      userLanguageString: 'Wednesday',
      learningLanguageString: 'Mercoledì',
      tip: 'Mercoledì comes from "Mercurio" (Mercury), the messenger god.',
      lessonId: SEED_UUIDS.lessonDaysOfWeek,
    },
  });
  console.log('✅ Teaching created/updated: Mercoledì');

  // Questions for Days of the Week
  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionLunedìMultipleChoice },
    update: {
      teachingId: SEED_UUIDS.teachingLunedì,
      type: DELIVERY_METHOD.MULTIPLE_CHOICE,
    },
    create: {
      id: SEED_UUIDS.questionLunedìMultipleChoice,
      teachingId: SEED_UUIDS.teachingLunedì,
      type: DELIVERY_METHOD.MULTIPLE_CHOICE,
      multipleChoice: {
        create: {
          options: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì'],
          correctIndices: [0],
        },
      },
    },
  });
  await prisma.questionMultipleChoice.upsert({
    where: { questionId: SEED_UUIDS.questionLunedìMultipleChoice },
    update: {
      options: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì'],
      correctIndices: [0],
    },
    create: {
      questionId: SEED_UUIDS.questionLunedìMultipleChoice,
      options: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì'],
      correctIndices: [0],
    },
  });
  console.log('✅ Question created/updated: Lunedì (Multiple Choice)');

  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionMartedìTranslation },
    update: {
      teachingId: SEED_UUIDS.teachingMartedì,
      type: DELIVERY_METHOD.TEXT_TRANSLATION,
    },
    create: {
      id: SEED_UUIDS.questionMartedìTranslation,
      teachingId: SEED_UUIDS.teachingMartedì,
      type: DELIVERY_METHOD.TEXT_TRANSLATION,
      textTranslation: {
        create: {
          acceptedAnswers: ['Tuesday', 'tuesday'],
        },
      },
    },
  });
  await prisma.questionTextTranslation.upsert({
    where: { questionId: SEED_UUIDS.questionMartedìTranslation },
    update: {
      acceptedAnswers: ['Tuesday', 'tuesday'],
    },
    create: {
      questionId: SEED_UUIDS.questionMartedìTranslation,
      acceptedAnswers: ['Tuesday', 'tuesday'],
    },
  });
  console.log('✅ Question created/updated: Martedì (Translation)');

  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionMercoledìFlashcard },
    update: {
      teachingId: SEED_UUIDS.teachingMercoledì,
      type: DELIVERY_METHOD.FLASHCARD,
    },
    create: {
      id: SEED_UUIDS.questionMercoledìFlashcard,
      teachingId: SEED_UUIDS.teachingMercoledì,
      type: DELIVERY_METHOD.FLASHCARD,
      flashcard: {
        create: {},
      },
    },
  });
  await prisma.questionFlashcard.upsert({
    where: { questionId: SEED_UUIDS.questionMercoledìFlashcard },
    update: {},
    create: {
      questionId: SEED_UUIDS.questionMercoledìFlashcard,
    },
  });
  console.log('✅ Question created/updated: Mercoledì (Flashcard)');

  // Lesson 5: Colors
  const lessonColors = await prisma.lesson.upsert({
    where: { id: SEED_UUIDS.lessonColors },
    update: {
      title: 'Colors',
      description: 'Learn basic colors in Italian',
      imageUrl: 'https://example.com/images/colors.jpg',
      moduleId: SEED_UUIDS.module,
      numberOfItems: 3,
    },
    create: {
      id: SEED_UUIDS.lessonColors,
      title: 'Colors',
      description: 'Learn basic colors in Italian',
      imageUrl: 'https://example.com/images/colors.jpg',
      moduleId: SEED_UUIDS.module,
      numberOfItems: 3,
    },
  });
  console.log('✅ Lesson created/updated:', lessonColors.title);

  const teachingRosso = await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingRosso },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🔴',
      userLanguageString: 'Red',
      learningLanguageString: 'Rosso',
      tip: 'Rosso changes to "rossa" for feminine nouns and "rossi/rosse" for plural.',
      lessonId: SEED_UUIDS.lessonColors,
    },
    create: {
      id: SEED_UUIDS.teachingRosso,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🔴',
      userLanguageString: 'Red',
      learningLanguageString: 'Rosso',
      tip: 'Rosso changes to "rossa" for feminine nouns and "rossi/rosse" for plural.',
      lessonId: SEED_UUIDS.lessonColors,
    },
  });
  console.log('✅ Teaching created/updated: Rosso');

  const teachingBlu = await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingBlu },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🔵',
      userLanguageString: 'Blue',
      learningLanguageString: 'Blu',
      tip: 'Blu is one of the few colors that doesn\'t change form for gender or number.',
      lessonId: SEED_UUIDS.lessonColors,
    },
    create: {
      id: SEED_UUIDS.teachingBlu,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🔵',
      userLanguageString: 'Blue',
      learningLanguageString: 'Blu',
      tip: 'Blu is one of the few colors that doesn\'t change form for gender or number.',
      lessonId: SEED_UUIDS.lessonColors,
    },
  });
  console.log('✅ Teaching created/updated: Blu');

  const teachingVerde = await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingVerde },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🟢',
      userLanguageString: 'Green',
      learningLanguageString: 'Verde',
      tip: 'Verde changes to "verdi" for plural, but stays the same for both masculine and feminine singular.',
      lessonId: SEED_UUIDS.lessonColors,
    },
    create: {
      id: SEED_UUIDS.teachingVerde,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🟢',
      userLanguageString: 'Green',
      learningLanguageString: 'Verde',
      tip: 'Verde changes to "verdi" for plural, but stays the same for both masculine and feminine singular.',
      lessonId: SEED_UUIDS.lessonColors,
    },
  });
  console.log('✅ Teaching created/updated: Verde');

  // Questions for Colors
  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionRossoMultipleChoice },
    update: {
      teachingId: SEED_UUIDS.teachingRosso,
      type: DELIVERY_METHOD.MULTIPLE_CHOICE,
    },
    create: {
      id: SEED_UUIDS.questionRossoMultipleChoice,
      teachingId: SEED_UUIDS.teachingRosso,
      type: DELIVERY_METHOD.MULTIPLE_CHOICE,
      multipleChoice: {
        create: {
          options: ['Rosso', 'Blu', 'Verde', 'Giallo'],
          correctIndices: [0],
        },
      },
    },
  });
  await prisma.questionMultipleChoice.upsert({
    where: { questionId: SEED_UUIDS.questionRossoMultipleChoice },
    update: {
      options: ['Rosso', 'Blu', 'Verde', 'Giallo'],
      correctIndices: [0],
    },
    create: {
      questionId: SEED_UUIDS.questionRossoMultipleChoice,
      options: ['Rosso', 'Blu', 'Verde', 'Giallo'],
      correctIndices: [0],
    },
  });
  console.log('✅ Question created/updated: Rosso (Multiple Choice)');

  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionBluTranslation },
    update: {
      teachingId: SEED_UUIDS.teachingBlu,
      type: DELIVERY_METHOD.TEXT_TRANSLATION,
    },
    create: {
      id: SEED_UUIDS.questionBluTranslation,
      teachingId: SEED_UUIDS.teachingBlu,
      type: DELIVERY_METHOD.TEXT_TRANSLATION,
      textTranslation: {
        create: {
          acceptedAnswers: ['Blue', 'blue'],
        },
      },
    },
  });
  await prisma.questionTextTranslation.upsert({
    where: { questionId: SEED_UUIDS.questionBluTranslation },
    update: {
      acceptedAnswers: ['Blue', 'blue'],
    },
    create: {
      questionId: SEED_UUIDS.questionBluTranslation,
      acceptedAnswers: ['Blue', 'blue'],
    },
  });
  console.log('✅ Question created/updated: Blu (Translation)');

  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionVerdeFillBlank },
    update: {
      teachingId: SEED_UUIDS.teachingVerde,
      type: DELIVERY_METHOD.FILL_BLANK,
    },
    create: {
      id: SEED_UUIDS.questionVerdeFillBlank,
      teachingId: SEED_UUIDS.teachingVerde,
      type: DELIVERY_METHOD.FILL_BLANK,
      fillBlank: {
        create: {
          blankIndices: [0],
          acceptedAnswers: { '0': ['Verde'] },
        },
      },
    },
  });
  await prisma.questionFillBlank.upsert({
    where: { questionId: SEED_UUIDS.questionVerdeFillBlank },
    update: {
      blankIndices: [0],
      acceptedAnswers: { '0': ['Verde'] },
    },
    create: {
      questionId: SEED_UUIDS.questionVerdeFillBlank,
      blankIndices: [0],
      acceptedAnswers: { '0': ['Verde'] },
    },
  });
  console.log('✅ Question created/updated: Verde (Fill Blank)');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 1 Module: "${module.title}"`);
  console.log(`   - 5 Lessons: "${lesson.title}", "${lessonNumbers.title}", "${lessonCommonPhrases.title}", "${lessonDaysOfWeek.title}", "${lessonColors.title}"`);
  console.log('   - 15 Teaching items: Ciao, Grazie, Per favore, Uno, Due, Tre, Scusa, Prego, Buongiorno, Lunedì, Martedì, Mercoledì, Rosso, Blu, Verde');
  console.log('   - 17 Questions covering all 6 delivery methods');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
