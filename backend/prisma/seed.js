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

  // We repurpose these as conceptual question IDs (variants hang off them)
  questionCiao: '00000000-0000-0000-0000-000000000020',
  questionGrazie: '00000000-0000-0000-0000-000000000023',
  questionPerFavore: '00000000-0000-0000-0000-000000000024',
};

async function upsertQuestionWithVariants({ questionId, teachingId, variants }) {
  await prisma.question.upsert({
    where: { id: questionId },
    update: { teachingId },
    create: { id: questionId, teachingId },
  });

  for (const variant of variants) {
    await prisma.questionVariant.upsert({
      where: {
        questionId_deliveryMethod: {
          questionId,
          deliveryMethod: variant.deliveryMethod,
        },
      },
      update: { data: variant.data },
      create: {
        questionId,
        deliveryMethod: variant.deliveryMethod,
        data: variant.data,
      },
    });
  }
}

async function main() {
  console.log('🌱 Starting seed (Question + QuestionVariant schema)...');

  // 1) Module + lesson
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

  // 2) Teachings
  await prisma.teaching.upsert({
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

  await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingGrazie },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🙏',
      userLanguageString: 'Thank you',
      learningLanguageString: 'Grazie',
      tip: 'Grazie is the most common way to say thank you.',
      lessonId: SEED_UUIDS.lesson,
    },
    create: {
      id: SEED_UUIDS.teachingGrazie,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🙏',
      userLanguageString: 'Thank you',
      learningLanguageString: 'Grazie',
      tip: 'Grazie is the most common way to say thank you.',
      lessonId: SEED_UUIDS.lesson,
    },
  });

  await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingPerFavore },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🙏',
      userLanguageString: 'Please',
      learningLanguageString: 'Per favore',
      tip: 'Per favore is used when making a request. It literally means \"for favor\".',
      lessonId: SEED_UUIDS.lesson,
    },
    create: {
      id: SEED_UUIDS.teachingPerFavore,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🙏',
      userLanguageString: 'Please',
      learningLanguageString: 'Per favore',
      tip: 'Per favore is used when making a request. It literally means \"for favor\".',
      lessonId: SEED_UUIDS.lesson,
    },
  });

  console.log('✅ Teachings created/updated (3)');

  // 3) Questions + variants (multi-modality)
  await upsertQuestionWithVariants({
    questionId: SEED_UUIDS.questionCiao,
    teachingId: SEED_UUIDS.teachingCiao,
    variants: [
      {
        deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE,
        data: {
          prompt: "How do you say 'Hi / Bye'?",
          options: [
            { id: 'opt1', label: 'Ciao', isCorrect: true },
            { id: 'opt2', label: 'Buongiorno', isCorrect: false },
            { id: 'opt3', label: 'Arrivederci', isCorrect: false },
            { id: 'opt4', label: 'Salve', isCorrect: false },
          ],
          explanation: 'Ciao is an informal greeting and farewell.',
        },
      },
      {
        deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION,
        data: {
          prompt: "Translate 'Ciao' to English",
          source: 'Ciao',
          answer: 'Hi / Bye',
          hint: 'Informal greeting/farewell',
        },
      },
      {
        deliveryMethod: DELIVERY_METHOD.SPEECH_TO_TEXT,
        data: {
          prompt: 'Listen and type what you hear',
          answer: 'Ciao',
        },
      },
    ],
  });

  await upsertQuestionWithVariants({
    questionId: SEED_UUIDS.questionGrazie,
    teachingId: SEED_UUIDS.teachingGrazie,
    variants: [
      {
        deliveryMethod: DELIVERY_METHOD.FILL_BLANK,
        data: {
          prompt: 'Complete the sentence',
          text: '___ Grazie',
          answer: 'Grazie',
          hint: 'A common way to say thank you',
        },
      },
      {
        deliveryMethod: DELIVERY_METHOD.FLASHCARD,
        data: {
          prompt: "Translate 'Grazie' to English",
          source: 'Grazie',
          answer: 'Thank you',
          hint: 'Most common “thank you”',
        },
      },
    ],
  });

  await upsertQuestionWithVariants({
    questionId: SEED_UUIDS.questionPerFavore,
    teachingId: SEED_UUIDS.teachingPerFavore,
    variants: [
      {
        deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION,
        data: {
          prompt: "Translate 'Per favore' to English",
          source: 'Per favore',
          answer: 'Please',
          hint: 'Used to make requests politely',
        },
      },
      {
        deliveryMethod: DELIVERY_METHOD.TEXT_TO_SPEECH,
        data: {
          prompt: 'Listen and repeat (speaking)',
          answer: 'Per favore',
        },
      },
    ],
  });

  console.log('✅ Questions + variants created/updated');
  console.log('🌱 Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } finally {
      await pool.end();
    }
  });

