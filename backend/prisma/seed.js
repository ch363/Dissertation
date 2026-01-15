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
  teachingCiao: '00000000-0000-0000-0000-000000000010',
  teachingGrazie: '00000000-0000-0000-0000-000000000011',
  teachingPerFavore: '00000000-0000-0000-0000-000000000012',
  questionCiaoMultipleChoice: '00000000-0000-0000-0000-000000000020',
  questionCiaoTranslation: '00000000-0000-0000-0000-000000000021',
  questionGrazieMultipleChoice: '00000000-0000-0000-0000-000000000022',
  questionGrazieFillBlank: '00000000-0000-0000-0000-000000000023',
  questionPerFavoreTranslation: '00000000-0000-0000-0000-000000000024',
  questionCiaoListening: '00000000-0000-0000-0000-000000000025',
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
          acceptedAnswers: ['Per favore', 'per favore', 'Perfavore'],
        },
      },
    },
  });
  await prisma.questionTextTranslation.upsert({
    where: { questionId: SEED_UUIDS.questionPerFavoreTranslation },
    update: {
      acceptedAnswers: ['Per favore', 'per favore', 'Perfavore'],
    },
    create: {
      questionId: SEED_UUIDS.questionPerFavoreTranslation,
      acceptedAnswers: ['Per favore', 'per favore', 'Perfavore'],
    },
  });
  console.log('✅ Question created/updated: Per favore (Translation)');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 1 Module: "${module.title}"`);
  console.log(`   - 1 Lesson: "${lesson.title}"`);
  console.log('   - 3 Teaching items: Ciao, Grazie, Per favore');
  console.log('   - 6 Questions with various delivery methods');
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
