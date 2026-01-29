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
  lessonGreetingsFormal: '00000000-0000-0000-0000-000000000004',
  lessonGreetingsIntroductions: '00000000-0000-0000-0000-000000000005',

  moduleTravel: '00000000-0000-0000-0000-000000000003',
  lessonTravelGettingAround: '00000000-0000-0000-0000-000000000006',
  lessonTravelAccommodation: '00000000-0000-0000-0000-000000000007',
  lessonTravelDining: '00000000-0000-0000-0000-000000000008',

  teachingCiao: '00000000-0000-0000-0000-000000000010',
  teachingGrazie: '00000000-0000-0000-0000-000000000011',
  teachingPerFavore: '00000000-0000-0000-0000-000000000012',

  teachingBuongiorno: '00000000-0000-0000-0000-000000000013',
  teachingBuonasera: '00000000-0000-0000-0000-000000000014',
  teachingArrivederci: '00000000-0000-0000-0000-000000000015',

  teachingPiacere: '00000000-0000-0000-0000-000000000016',
  teachingComeTiChiami: '00000000-0000-0000-0000-000000000017',
  teachingMiChiamo: '00000000-0000-0000-0000-000000000018',

  teachingDoveSiTrova: '00000000-0000-0000-0000-000000000019',
  teachingUnBiglietto: '00000000-0000-0000-0000-00000000001a',
  teachingQuantoCosta: '00000000-0000-0000-0000-00000000001b',

  teachingHoUnaPrenotazione: '00000000-0000-0000-0000-00000000001c',
  teachingLaChiave: '00000000-0000-0000-0000-00000000001d',
  teachingDoveIlBagno: '00000000-0000-0000-0000-00000000001e',

  teachingIlConto: '00000000-0000-0000-0000-00000000001f',
  teachingAcqua: '00000000-0000-0000-0000-000000000021',
  teachingSonoAllergico: '00000000-0000-0000-0000-000000000022',

  // We repurpose these as conceptual question IDs (variants hang off them)
  questionCiao: '00000000-0000-0000-0000-000000000020',
  questionGrazie: '00000000-0000-0000-0000-000000000023',
  questionPerFavore: '00000000-0000-0000-0000-000000000024',

  questionBuongiorno: '00000000-0000-0000-0000-000000000025',
  questionBuonasera: '00000000-0000-0000-0000-000000000026',
  questionArrivederci: '00000000-0000-0000-0000-000000000027',

  questionPiacere: '00000000-0000-0000-0000-000000000028',
  questionComeTiChiami: '00000000-0000-0000-0000-000000000029',
  questionMiChiamo: '00000000-0000-0000-0000-00000000002a',

  questionDoveSiTrova: '00000000-0000-0000-0000-00000000002b',
  questionUnBiglietto: '00000000-0000-0000-0000-00000000002c',
  questionQuantoCosta: '00000000-0000-0000-0000-00000000002d',

  questionHoUnaPrenotazione: '00000000-0000-0000-0000-00000000002e',
  questionLaChiave: '00000000-0000-0000-0000-00000000002f',
  questionDoveIlBagno: '00000000-0000-0000-0000-000000000030',

  questionIlConto: '00000000-0000-0000-0000-000000000031',
  questionAcqua: '00000000-0000-0000-0000-000000000032',
  questionSonoAllergico: '00000000-0000-0000-0000-000000000033',
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

  // 1) Basics module + lessons (Greetings now has 3 lessons total)
  // Cover image: student studying (Unsplash) – URL stored in DB only
  const MODULE_IMAGES = {
    basics:
      'https://images.unsplash.com/photo-1596247290824-e9f12b8c574f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
    travel:
      'https://images.unsplash.com/photo-1619467416348-6a782839e95f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
  };
  const module = await prisma.module.upsert({
    where: { id: SEED_UUIDS.module },
    update: {
      title: 'Basics',
      description: 'Essential Italian phrases and greetings for beginners',
      imageUrl: MODULE_IMAGES.basics,
      category: 'Getting Started',
    },
    create: {
      id: SEED_UUIDS.module,
      title: 'Basics',
      description: 'Essential Italian phrases and greetings for beginners',
      imageUrl: MODULE_IMAGES.basics,
      category: 'Getting Started',
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

  const greetingsFormalLesson = await prisma.lesson.upsert({
    where: { id: SEED_UUIDS.lessonGreetingsFormal },
    update: {
      title: 'Greetings (Formal)',
      description: 'Polite greetings for different times of day',
      imageUrl: 'https://example.com/images/greetings-formal.jpg',
      moduleId: SEED_UUIDS.module,
      numberOfItems: 3,
    },
    create: {
      id: SEED_UUIDS.lessonGreetingsFormal,
      title: 'Greetings (Formal)',
      description: 'Polite greetings for different times of day',
      imageUrl: 'https://example.com/images/greetings-formal.jpg',
      moduleId: SEED_UUIDS.module,
      numberOfItems: 3,
    },
  });
  console.log('✅ Lesson created/updated:', greetingsFormalLesson.title);

  const greetingsIntroductionsLesson = await prisma.lesson.upsert({
    where: { id: SEED_UUIDS.lessonGreetingsIntroductions },
    update: {
      title: 'Greetings (Introductions)',
      description: 'Introduce yourself and ask someone’s name',
      imageUrl: 'https://example.com/images/introductions.jpg',
      moduleId: SEED_UUIDS.module,
      numberOfItems: 3,
    },
    create: {
      id: SEED_UUIDS.lessonGreetingsIntroductions,
      title: 'Greetings (Introductions)',
      description: 'Introduce yourself and ask someone’s name',
      imageUrl: 'https://example.com/images/introductions.jpg',
      moduleId: SEED_UUIDS.module,
      numberOfItems: 3,
    },
  });
  console.log('✅ Lesson created/updated:', greetingsIntroductionsLesson.title);

  // 2) Teachings (Basics - Greetings & Essentials)
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

  // Teachings (Basics - Greetings Formal)
  await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingBuongiorno },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🌅',
      userLanguageString: 'Good morning',
      learningLanguageString: 'Buongiorno',
      tip: 'Used in the morning/early afternoon as a polite greeting.',
      lessonId: SEED_UUIDS.lessonGreetingsFormal,
    },
    create: {
      id: SEED_UUIDS.teachingBuongiorno,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🌅',
      userLanguageString: 'Good morning',
      learningLanguageString: 'Buongiorno',
      tip: 'Used in the morning/early afternoon as a polite greeting.',
      lessonId: SEED_UUIDS.lessonGreetingsFormal,
    },
  });

  await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingBuonasera },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🌇',
      userLanguageString: 'Good evening',
      learningLanguageString: 'Buonasera',
      tip: 'Used in the late afternoon/evening.',
      lessonId: SEED_UUIDS.lessonGreetingsFormal,
    },
    create: {
      id: SEED_UUIDS.teachingBuonasera,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🌇',
      userLanguageString: 'Good evening',
      learningLanguageString: 'Buonasera',
      tip: 'Used in the late afternoon/evening.',
      lessonId: SEED_UUIDS.lessonGreetingsFormal,
    },
  });

  await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingArrivederci },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '👋',
      userLanguageString: 'Goodbye',
      learningLanguageString: 'Arrivederci',
      tip: 'A polite way to say goodbye (“until we meet again”).',
      lessonId: SEED_UUIDS.lessonGreetingsFormal,
    },
    create: {
      id: SEED_UUIDS.teachingArrivederci,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '👋',
      userLanguageString: 'Goodbye',
      learningLanguageString: 'Arrivederci',
      tip: 'A polite way to say goodbye (“until we meet again”).',
      lessonId: SEED_UUIDS.lessonGreetingsFormal,
    },
  });

  // Teachings (Basics - Greetings Introductions)
  await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingPiacere },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🤝',
      userLanguageString: 'Nice to meet you',
      learningLanguageString: 'Piacere',
      tip: 'Often said when meeting someone for the first time.',
      lessonId: SEED_UUIDS.lessonGreetingsIntroductions,
    },
    create: {
      id: SEED_UUIDS.teachingPiacere,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🤝',
      userLanguageString: 'Nice to meet you',
      learningLanguageString: 'Piacere',
      tip: 'Often said when meeting someone for the first time.',
      lessonId: SEED_UUIDS.lessonGreetingsIntroductions,
    },
  });

  await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingComeTiChiami },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '❓',
      userLanguageString: "What's your name?",
      learningLanguageString: 'Come ti chiami?',
      tip: 'Informal “What are you called?” (to a friend/peer).',
      lessonId: SEED_UUIDS.lessonGreetingsIntroductions,
    },
    create: {
      id: SEED_UUIDS.teachingComeTiChiami,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '❓',
      userLanguageString: "What's your name?",
      learningLanguageString: 'Come ti chiami?',
      tip: 'Informal “What are you called?” (to a friend/peer).',
      lessonId: SEED_UUIDS.lessonGreetingsIntroductions,
    },
  });

  await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingMiChiamo },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🧑‍💼',
      userLanguageString: 'My name is …',
      learningLanguageString: 'Mi chiamo …',
      tip: 'Literally “I call myself …”. Replace … with your name.',
      lessonId: SEED_UUIDS.lessonGreetingsIntroductions,
    },
    create: {
      id: SEED_UUIDS.teachingMiChiamo,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🧑‍💼',
      userLanguageString: 'My name is …',
      learningLanguageString: 'Mi chiamo …',
      tip: 'Literally “I call myself …”. Replace … with your name.',
      lessonId: SEED_UUIDS.lessonGreetingsIntroductions,
    },
  });

  console.log('✅ Teachings created/updated (Basics: 9)');

  // 3) Questions + variants (multi-modality) - Basics
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

  await upsertQuestionWithVariants({
    questionId: SEED_UUIDS.questionBuongiorno,
    teachingId: SEED_UUIDS.teachingBuongiorno,
    variants: [
      {
        deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE,
        data: {
          prompt: "How do you say 'Good morning'?",
          options: [
            { id: 'opt1', label: 'Buongiorno', isCorrect: true },
            { id: 'opt2', label: 'Buonasera', isCorrect: false },
            { id: 'opt3', label: 'Arrivederci', isCorrect: false },
            { id: 'opt4', label: 'Ciao', isCorrect: false },
          ],
        },
      },
      {
        deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION,
        data: {
          prompt: "Translate 'Buongiorno' to English",
          source: 'Buongiorno',
          answer: 'Good morning',
        },
      },
    ],
  });

  await upsertQuestionWithVariants({
    questionId: SEED_UUIDS.questionBuonasera,
    teachingId: SEED_UUIDS.teachingBuonasera,
    variants: [
      {
        deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION,
        data: {
          prompt: "Translate 'Buonasera' to English",
          source: 'Buonasera',
          answer: 'Good evening',
        },
      },
      {
        deliveryMethod: DELIVERY_METHOD.TEXT_TO_SPEECH,
        data: {
          prompt: 'Listen and repeat (speaking)',
          answer: 'Buonasera',
        },
      },
    ],
  });

  await upsertQuestionWithVariants({
    questionId: SEED_UUIDS.questionArrivederci,
    teachingId: SEED_UUIDS.teachingArrivederci,
    variants: [
      {
        deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE,
        data: {
          prompt: "How do you say 'Goodbye'?",
          options: [
            { id: 'opt1', label: 'Arrivederci', isCorrect: true },
            { id: 'opt2', label: 'Grazie', isCorrect: false },
            { id: 'opt3', label: 'Ciao', isCorrect: false },
            { id: 'opt4', label: 'Buongiorno', isCorrect: false },
          ],
        },
      },
      {
        deliveryMethod: DELIVERY_METHOD.FLASHCARD,
        data: {
          prompt: "Translate 'Arrivederci' to English",
          source: 'Arrivederci',
          answer: 'Goodbye',
        },
      },
    ],
  });

  await upsertQuestionWithVariants({
    questionId: SEED_UUIDS.questionPiacere,
    teachingId: SEED_UUIDS.teachingPiacere,
    variants: [
      {
        deliveryMethod: DELIVERY_METHOD.FLASHCARD,
        data: {
          prompt: "Translate 'Piacere' to English",
          source: 'Piacere',
          answer: 'Nice to meet you',
        },
      },
      {
        deliveryMethod: DELIVERY_METHOD.TEXT_TO_SPEECH,
        data: {
          prompt: 'Listen and repeat (speaking)',
          answer: 'Piacere',
        },
      },
    ],
  });

  await upsertQuestionWithVariants({
    questionId: SEED_UUIDS.questionComeTiChiami,
    teachingId: SEED_UUIDS.teachingComeTiChiami,
    variants: [
      {
        deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION,
        data: {
          prompt: "Translate 'Come ti chiami?' to English",
          source: 'Come ti chiami?',
          answer: "What's your name?",
        },
      },
      {
        deliveryMethod: DELIVERY_METHOD.SPEECH_TO_TEXT,
        data: {
          prompt: 'Listen and type what you hear',
          answer: 'Come ti chiami?',
        },
      },
    ],
  });

  await upsertQuestionWithVariants({
    questionId: SEED_UUIDS.questionMiChiamo,
    teachingId: SEED_UUIDS.teachingMiChiamo,
    variants: [
      {
        deliveryMethod: DELIVERY_METHOD.FILL_BLANK,
        data: {
          prompt: 'Complete the sentence',
          text: 'Mi chiamo ___',
          answer: 'Marco',
          hint: 'Use any name here — this is an example.',
        },
      },
      {
        deliveryMethod: DELIVERY_METHOD.TEXT_TO_SPEECH,
        data: {
          prompt: 'Listen and repeat (speaking)',
          answer: 'Mi chiamo Marco',
        },
      },
    ],
  });

  console.log('✅ Questions + variants created/updated (Basics)');

  // 4) Travel module + 3 lessons
  // Cover image: travel & adventure (Unsplash) – URL stored in DB only
  const travelModule = await prisma.module.upsert({
    where: { id: SEED_UUIDS.moduleTravel },
    update: {
      title: 'Travel',
      description: 'Practical phrases for getting around, hotels, and restaurants',
      imageUrl: MODULE_IMAGES.travel,
      category: 'Topics',
    },
    create: {
      id: SEED_UUIDS.moduleTravel,
      title: 'Travel',
      description: 'Practical phrases for getting around, hotels, and restaurants',
      imageUrl: MODULE_IMAGES.travel,
      category: 'Topics',
    },
  });
  console.log('✅ Module created/updated:', travelModule.title);

  const travelGettingAround = await prisma.lesson.upsert({
    where: { id: SEED_UUIDS.lessonTravelGettingAround },
    update: {
      title: 'Getting Around',
      description: 'Tickets, directions, and prices',
      imageUrl: 'https://example.com/images/getting-around.jpg',
      moduleId: SEED_UUIDS.moduleTravel,
      numberOfItems: 3,
    },
    create: {
      id: SEED_UUIDS.lessonTravelGettingAround,
      title: 'Getting Around',
      description: 'Tickets, directions, and prices',
      imageUrl: 'https://example.com/images/getting-around.jpg',
      moduleId: SEED_UUIDS.moduleTravel,
      numberOfItems: 3,
    },
  });
  console.log('✅ Lesson created/updated:', travelGettingAround.title);

  const travelAccommodation = await prisma.lesson.upsert({
    where: { id: SEED_UUIDS.lessonTravelAccommodation },
    update: {
      title: 'Accommodation',
      description: 'Hotel check-in and essentials',
      imageUrl: 'https://example.com/images/accommodation.jpg',
      moduleId: SEED_UUIDS.moduleTravel,
      numberOfItems: 3,
    },
    create: {
      id: SEED_UUIDS.lessonTravelAccommodation,
      title: 'Accommodation',
      description: 'Hotel check-in and essentials',
      imageUrl: 'https://example.com/images/accommodation.jpg',
      moduleId: SEED_UUIDS.moduleTravel,
      numberOfItems: 3,
    },
  });
  console.log('✅ Lesson created/updated:', travelAccommodation.title);

  const travelDining = await prisma.lesson.upsert({
    where: { id: SEED_UUIDS.lessonTravelDining },
    update: {
      title: 'Dining Out',
      description: 'Ordering and paying at restaurants',
      imageUrl: 'https://example.com/images/dining.jpg',
      moduleId: SEED_UUIDS.moduleTravel,
      numberOfItems: 3,
    },
    create: {
      id: SEED_UUIDS.lessonTravelDining,
      title: 'Dining Out',
      description: 'Ordering and paying at restaurants',
      imageUrl: 'https://example.com/images/dining.jpg',
      moduleId: SEED_UUIDS.moduleTravel,
      numberOfItems: 3,
    },
  });
  console.log('✅ Lesson created/updated:', travelDining.title);

  // Teachings (Travel)
  await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingDoveSiTrova },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🧭',
      userLanguageString: 'Where is …?',
      learningLanguageString: 'Dove si trova …?',
      tip: 'Useful for asking directions.',
      lessonId: SEED_UUIDS.lessonTravelGettingAround,
    },
    create: {
      id: SEED_UUIDS.teachingDoveSiTrova,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🧭',
      userLanguageString: 'Where is …?',
      learningLanguageString: 'Dove si trova …?',
      tip: 'Useful for asking directions.',
      lessonId: SEED_UUIDS.lessonTravelGettingAround,
    },
  });

  await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingUnBiglietto },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🎟️',
      userLanguageString: 'A ticket, please',
      learningLanguageString: 'Un biglietto, per favore',
      tip: 'Use it for buses, trains, museums, etc.',
      lessonId: SEED_UUIDS.lessonTravelGettingAround,
    },
    create: {
      id: SEED_UUIDS.teachingUnBiglietto,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🎟️',
      userLanguageString: 'A ticket, please',
      learningLanguageString: 'Un biglietto, per favore',
      tip: 'Use it for buses, trains, museums, etc.',
      lessonId: SEED_UUIDS.lessonTravelGettingAround,
    },
  });

  await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingQuantoCosta },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '💶',
      userLanguageString: 'How much does it cost?',
      learningLanguageString: 'Quanto costa?',
      tip: 'A classic question when shopping or buying tickets.',
      lessonId: SEED_UUIDS.lessonTravelGettingAround,
    },
    create: {
      id: SEED_UUIDS.teachingQuantoCosta,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '💶',
      userLanguageString: 'How much does it cost?',
      learningLanguageString: 'Quanto costa?',
      tip: 'A classic question when shopping or buying tickets.',
      lessonId: SEED_UUIDS.lessonTravelGettingAround,
    },
  });

  await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingHoUnaPrenotazione },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🏨',
      userLanguageString: 'I have a reservation',
      learningLanguageString: 'Ho una prenotazione',
      tip: 'Say this at hotel check-in.',
      lessonId: SEED_UUIDS.lessonTravelAccommodation,
    },
    create: {
      id: SEED_UUIDS.teachingHoUnaPrenotazione,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🏨',
      userLanguageString: 'I have a reservation',
      learningLanguageString: 'Ho una prenotazione',
      tip: 'Say this at hotel check-in.',
      lessonId: SEED_UUIDS.lessonTravelAccommodation,
    },
  });

  await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingLaChiave },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🔑',
      userLanguageString: 'The key',
      learningLanguageString: 'La chiave',
      tip: 'You might hear: “Ecco la chiave.” (Here is the key.)',
      lessonId: SEED_UUIDS.lessonTravelAccommodation,
    },
    create: {
      id: SEED_UUIDS.teachingLaChiave,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🔑',
      userLanguageString: 'The key',
      learningLanguageString: 'La chiave',
      tip: 'You might hear: “Ecco la chiave.” (Here is the key.)',
      lessonId: SEED_UUIDS.lessonTravelAccommodation,
    },
  });

  await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingDoveIlBagno },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🚻',
      userLanguageString: 'Where is the bathroom?',
      learningLanguageString: "Dov'è il bagno?",
      tip: 'Super useful in any trip.',
      lessonId: SEED_UUIDS.lessonTravelAccommodation,
    },
    create: {
      id: SEED_UUIDS.teachingDoveIlBagno,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🚻',
      userLanguageString: 'Where is the bathroom?',
      learningLanguageString: "Dov'è il bagno?",
      tip: 'Super useful in any trip.',
      lessonId: SEED_UUIDS.lessonTravelAccommodation,
    },
  });

  await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingIlConto },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🧾',
      userLanguageString: 'The bill, please',
      learningLanguageString: 'Il conto, per favore',
      tip: 'Ask to pay at a restaurant.',
      lessonId: SEED_UUIDS.lessonTravelDining,
    },
    create: {
      id: SEED_UUIDS.teachingIlConto,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🧾',
      userLanguageString: 'The bill, please',
      learningLanguageString: 'Il conto, per favore',
      tip: 'Ask to pay at a restaurant.',
      lessonId: SEED_UUIDS.lessonTravelDining,
    },
  });

  await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingAcqua },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '💧',
      userLanguageString: 'Water',
      learningLanguageString: 'Acqua',
      tip: 'Common: “Acqua naturale” (still) / “Acqua frizzante” (sparkling).',
      lessonId: SEED_UUIDS.lessonTravelDining,
    },
    create: {
      id: SEED_UUIDS.teachingAcqua,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '💧',
      userLanguageString: 'Water',
      learningLanguageString: 'Acqua',
      tip: 'Common: “Acqua naturale” (still) / “Acqua frizzante” (sparkling).',
      lessonId: SEED_UUIDS.lessonTravelDining,
    },
  });

  await prisma.teaching.upsert({
    where: { id: SEED_UUIDS.teachingSonoAllergico },
    update: {
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '⚠️',
      userLanguageString: 'I am allergic to …',
      learningLanguageString: 'Sono allergico/a a …',
      tip: 'Add the allergen (e.g., “Sono allergico/a a le noci”).',
      lessonId: SEED_UUIDS.lessonTravelDining,
    },
    create: {
      id: SEED_UUIDS.teachingSonoAllergico,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '⚠️',
      userLanguageString: 'I am allergic to …',
      learningLanguageString: 'Sono allergico/a a …',
      tip: 'Add the allergen (e.g., “Sono allergico/a a le noci”).',
      lessonId: SEED_UUIDS.lessonTravelDining,
    },
  });

  console.log('✅ Teachings created/updated (Travel: 9)');

  // Questions + variants (Travel)
  await upsertQuestionWithVariants({
    questionId: SEED_UUIDS.questionDoveSiTrova,
    teachingId: SEED_UUIDS.teachingDoveSiTrova,
    variants: [
      {
        deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION,
        data: {
          prompt: "Translate 'Dove si trova …?' to English",
          source: 'Dove si trova …?',
          answer: 'Where is …?',
        },
      },
      {
        deliveryMethod: DELIVERY_METHOD.SPEECH_TO_TEXT,
        data: {
          prompt: 'Listen and type what you hear',
          answer: 'Dove si trova …?',
        },
      },
    ],
  });

  await upsertQuestionWithVariants({
    questionId: SEED_UUIDS.questionUnBiglietto,
    teachingId: SEED_UUIDS.teachingUnBiglietto,
    variants: [
      {
        deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE,
        data: {
          prompt: "How do you say 'A ticket, please'?",
          options: [
            { id: 'opt1', label: 'Un biglietto, per favore', isCorrect: true },
            { id: 'opt2', label: 'Quanto costa?', isCorrect: false },
            { id: 'opt3', label: 'Il conto, per favore', isCorrect: false },
            { id: 'opt4', label: 'Ho una prenotazione', isCorrect: false },
          ],
        },
      },
      {
        deliveryMethod: DELIVERY_METHOD.FLASHCARD,
        data: {
          prompt: "Translate 'Un biglietto, per favore' to English",
          source: 'Un biglietto, per favore',
          answer: 'A ticket, please',
        },
      },
    ],
  });

  await upsertQuestionWithVariants({
    questionId: SEED_UUIDS.questionQuantoCosta,
    teachingId: SEED_UUIDS.teachingQuantoCosta,
    variants: [
      {
        deliveryMethod: DELIVERY_METHOD.FLASHCARD,
        data: {
          prompt: "Translate 'Quanto costa?' to English",
          source: 'Quanto costa?',
          answer: 'How much does it cost?',
        },
      },
      {
        deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE,
        data: {
          prompt: "How do you say 'How much does it cost?'?",
          options: [
            { id: 'opt1', label: 'Quanto costa?', isCorrect: true },
            { id: 'opt2', label: 'Dove si trova …?', isCorrect: false },
            { id: 'opt3', label: 'Grazie', isCorrect: false },
            { id: 'opt4', label: 'Per favore', isCorrect: false },
          ],
        },
      },
    ],
  });

  await upsertQuestionWithVariants({
    questionId: SEED_UUIDS.questionHoUnaPrenotazione,
    teachingId: SEED_UUIDS.teachingHoUnaPrenotazione,
    variants: [
      {
        deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION,
        data: {
          prompt: "Translate 'Ho una prenotazione' to English",
          source: 'Ho una prenotazione',
          answer: 'I have a reservation',
        },
      },
      {
        deliveryMethod: DELIVERY_METHOD.TEXT_TO_SPEECH,
        data: {
          prompt: 'Listen and repeat (speaking)',
          answer: 'Ho una prenotazione',
        },
      },
    ],
  });

  await upsertQuestionWithVariants({
    questionId: SEED_UUIDS.questionLaChiave,
    teachingId: SEED_UUIDS.teachingLaChiave,
    variants: [
      {
        deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE,
        data: {
          prompt: "What does 'La chiave' mean?",
          options: [
            { id: 'opt1', label: 'The key', isCorrect: true },
            { id: 'opt2', label: 'The bill', isCorrect: false },
            { id: 'opt3', label: 'The bathroom', isCorrect: false },
            { id: 'opt4', label: 'The ticket', isCorrect: false },
          ],
        },
      },
      {
        deliveryMethod: DELIVERY_METHOD.FLASHCARD,
        data: {
          prompt: "Translate 'La chiave' to English",
          source: 'La chiave',
          answer: 'The key',
        },
      },
    ],
  });

  await upsertQuestionWithVariants({
    questionId: SEED_UUIDS.questionDoveIlBagno,
    teachingId: SEED_UUIDS.teachingDoveIlBagno,
    variants: [
      {
        deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION,
        data: {
          prompt: `Translate "Dov'è il bagno?" to English`,
          source: "Dov'è il bagno?",
          answer: 'Where is the bathroom?',
        },
      },
      {
        deliveryMethod: DELIVERY_METHOD.SPEECH_TO_TEXT,
        data: {
          prompt: 'Listen and type what you hear',
          answer: "Dov'è il bagno?",
        },
      },
    ],
  });

  await upsertQuestionWithVariants({
    questionId: SEED_UUIDS.questionIlConto,
    teachingId: SEED_UUIDS.teachingIlConto,
    variants: [
      {
        deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION,
        data: {
          prompt: "Translate 'Il conto, per favore' to English",
          source: 'Il conto, per favore',
          answer: 'The bill, please',
        },
      },
      {
        deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE,
        data: {
          prompt: "How do you say 'The bill, please'?",
          options: [
            { id: 'opt1', label: 'Il conto, per favore', isCorrect: true },
            { id: 'opt2', label: 'Un biglietto, per favore', isCorrect: false },
            { id: 'opt3', label: 'Ho una prenotazione', isCorrect: false },
            { id: 'opt4', label: 'Buonasera', isCorrect: false },
          ],
        },
      },
    ],
  });

  await upsertQuestionWithVariants({
    questionId: SEED_UUIDS.questionAcqua,
    teachingId: SEED_UUIDS.teachingAcqua,
    variants: [
      {
        deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE,
        data: {
          prompt: "What does 'Acqua' mean?",
          options: [
            { id: 'opt1', label: 'Water', isCorrect: true },
            { id: 'opt2', label: 'Wine', isCorrect: false },
            { id: 'opt3', label: 'Coffee', isCorrect: false },
            { id: 'opt4', label: 'Tea', isCorrect: false },
          ],
        },
      },
      {
        deliveryMethod: DELIVERY_METHOD.FLASHCARD,
        data: {
          prompt: "Translate 'Acqua' to English",
          source: 'Acqua',
          answer: 'Water',
        },
      },
    ],
  });

  await upsertQuestionWithVariants({
    questionId: SEED_UUIDS.questionSonoAllergico,
    teachingId: SEED_UUIDS.teachingSonoAllergico,
    variants: [
      {
        deliveryMethod: DELIVERY_METHOD.FLASHCARD,
        data: {
          prompt: "Translate 'Sono allergico/a a …' to English",
          source: 'Sono allergico/a a …',
          answer: 'I am allergic to …',
        },
      },
      {
        deliveryMethod: DELIVERY_METHOD.TEXT_TO_SPEECH,
        data: {
          prompt: 'Listen and repeat (speaking)',
          answer: 'Sono allergico a …',
        },
      },
    ],
  });

  console.log('✅ Questions + variants created/updated (Travel)');
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

