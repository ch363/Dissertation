// JavaScript version of seed script to avoid TypeScript/ts-node issues
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

// Verify DATABASE_URL is set before importing PrismaClient
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL is not set');
  console.error('   Please set DATABASE_URL in your .env file or environment variables');
  process.exit(1);
}

const crypto = require('crypto');
const { PrismaClient, KNOWLEDGE_LEVEL, DELIVERY_METHOD } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// Create PrismaClient with adapter (required for this Prisma setup)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }
    : { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Deterministic UUID from namespace + parts (for new content only)
const SEED_NAMESPACE = 'a1b2c3d4-e5f6-4780-a1b2-c3d4e5f67890';
function seedId(...parts) {
  const str = [SEED_NAMESPACE, ...parts].join('-');
  const hex = crypto.createHash('sha256').update(str).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

// Existing deterministic UUIDs (preserved for idempotent seeding and existing references)
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

const MODULE_IMAGES = {
  basics: 'https://images.unsplash.com/photo-1596247290824-e9f12b8c574f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
  travel: 'https://images.unsplash.com/photo-1619467416348-6a782839e95f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
  dailyLife: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
  foodDining: 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
};

// Build default question variants for a teaching (EN/IT strings). Returns array of { deliveryMethod, data }.
function buildVariants(teaching) {
  const en = teaching.userLanguageString;
  const it = teaching.learningLanguageString;
  const variants = [
    {
      deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION,
      data: {
        prompt: `Translate '${it}' to English`,
        source: it,
        answer: en,
        hint: teaching.tip || undefined,
      },
    },
    {
      deliveryMethod: DELIVERY_METHOD.FLASHCARD,
      data: {
        prompt: `Translate '${it}' to English`,
        source: it,
        answer: en,
        hint: teaching.tip || undefined,
      },
    },
  ];
  if (it.length < 50) {
    variants.push({
      deliveryMethod: DELIVERY_METHOD.TEXT_TO_SPEECH,
      data: { prompt: 'Listen and repeat (speaking)', answer: it },
    });
  }
  return variants;
}

async function upsertQuestionWithVariants(questionId, teachingId, variants) {
  await prisma.question.upsert({
    where: { id: questionId },
    update: { teachingId },
    create: { id: questionId, teachingId },
  });
  for (const variant of variants) {
    await prisma.questionVariant.upsert({
      where: {
        questionId_deliveryMethod: { questionId, deliveryMethod: variant.deliveryMethod },
      },
      update: { data: variant.data },
      create: { questionId, deliveryMethod: variant.deliveryMethod, data: variant.data },
    });
  }
}

// Content manifest: 4 modules, 10 lessons each. Each lesson has teachings[] with { id, questionId, userLanguageString, learningLanguageString, tip, emoji, variants? }.
// If variants is provided, use it; else use buildVariants(teaching).
const CONTENT_MANIFEST = [
  // —— MODULE 1: Basics ——
  {
    id: SEED_UUIDS.module,
    title: 'Basics',
    description: 'Essential Italian phrases and greetings for beginners',
    imageUrl: MODULE_IMAGES.basics,
    category: 'Getting Started',
    lessons: [
      {
        id: SEED_UUIDS.lesson,
        title: 'Greetings & Essentials',
        description: 'Learn basic greetings and essential phrases in Italian',
        numberOfItems: 3,
        teachings: [
          { id: SEED_UUIDS.teachingCiao, questionId: SEED_UUIDS.questionCiao, userLanguageString: 'Hi / Bye', learningLanguageString: 'Ciao', tip: 'Ciao is used both for greeting and saying goodbye in informal situations.', emoji: '👋', variants: [{ deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE, data: { prompt: "How do you say 'Hi / Bye'?", options: [{ id: 'opt1', label: 'Ciao', isCorrect: true }, { id: 'opt2', label: 'Buongiorno', isCorrect: false }, { id: 'opt3', label: 'Arrivederci', isCorrect: false }, { id: 'opt4', label: 'Salve', isCorrect: false }], explanation: 'Ciao is an informal greeting and farewell.' } }, { deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION, data: { prompt: "Translate 'Ciao' to English", source: 'Ciao', answer: 'Hi / Bye', hint: 'Informal greeting/farewell' } }, { deliveryMethod: DELIVERY_METHOD.SPEECH_TO_TEXT, data: { prompt: 'Listen and type what you hear', answer: 'Ciao' } }] },
          { id: SEED_UUIDS.teachingGrazie, questionId: SEED_UUIDS.questionGrazie, userLanguageString: 'Thank you', learningLanguageString: 'Grazie', tip: 'Grazie is the most common way to say thank you.', emoji: '🙏', variants: [{ deliveryMethod: DELIVERY_METHOD.FILL_BLANK, data: { prompt: 'Complete the sentence', text: '___ Grazie', answer: 'Grazie', hint: 'A common way to say thank you' } }, { deliveryMethod: DELIVERY_METHOD.FLASHCARD, data: { prompt: "Translate 'Grazie' to English", source: 'Grazie', answer: 'Thank you', hint: 'Most common "thank you"' } }] },
          { id: SEED_UUIDS.teachingPerFavore, questionId: SEED_UUIDS.questionPerFavore, userLanguageString: 'Please', learningLanguageString: 'Per favore', tip: 'Per favore is used when making a request.', emoji: '🙏', variants: [{ deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION, data: { prompt: "Translate 'Per favore' to English", source: 'Per favore', answer: 'Please', hint: 'Used to make requests politely' } }, { deliveryMethod: DELIVERY_METHOD.TEXT_TO_SPEECH, data: { prompt: 'Listen and repeat (speaking)', answer: 'Per favore' } }] },
        ],
      },
      {
        id: SEED_UUIDS.lessonGreetingsFormal,
        title: 'Greetings (Formal)',
        description: 'Polite greetings for different times of day',
        numberOfItems: 3,
        teachings: [
          { id: SEED_UUIDS.teachingBuongiorno, questionId: SEED_UUIDS.questionBuongiorno, userLanguageString: 'Good morning', learningLanguageString: 'Buongiorno', tip: 'Used in the morning/early afternoon as a polite greeting.', emoji: '🌅', variants: [{ deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE, data: { prompt: "How do you say 'Good morning'?", options: [{ id: 'opt1', label: 'Buongiorno', isCorrect: true }, { id: 'opt2', label: 'Buonasera', isCorrect: false }, { id: 'opt3', label: 'Arrivederci', isCorrect: false }, { id: 'opt4', label: 'Ciao', isCorrect: false }] } }, { deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION, data: { prompt: "Translate 'Buongiorno' to English", source: 'Buongiorno', answer: 'Good morning' } }] },
          { id: SEED_UUIDS.teachingBuonasera, questionId: SEED_UUIDS.questionBuonasera, userLanguageString: 'Good evening', learningLanguageString: 'Buonasera', tip: 'Used in the late afternoon/evening.', emoji: '🌇', variants: [{ deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION, data: { prompt: "Translate 'Buonasera' to English", source: 'Buonasera', answer: 'Good evening' } }, { deliveryMethod: DELIVERY_METHOD.TEXT_TO_SPEECH, data: { prompt: 'Listen and repeat (speaking)', answer: 'Buonasera' } }] },
          { id: SEED_UUIDS.teachingArrivederci, questionId: SEED_UUIDS.questionArrivederci, userLanguageString: 'Goodbye', learningLanguageString: 'Arrivederci', tip: 'A polite way to say goodbye.', emoji: '👋', variants: [{ deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE, data: { prompt: "How do you say 'Goodbye'?", options: [{ id: 'opt1', label: 'Arrivederci', isCorrect: true }, { id: 'opt2', label: 'Grazie', isCorrect: false }, { id: 'opt3', label: 'Ciao', isCorrect: false }, { id: 'opt4', label: 'Buongiorno', isCorrect: false }] } }, { deliveryMethod: DELIVERY_METHOD.FLASHCARD, data: { prompt: "Translate 'Arrivederci' to English", source: 'Arrivederci', answer: 'Goodbye' } }] },
        ],
      },
      {
        id: SEED_UUIDS.lessonGreetingsIntroductions,
        title: 'Greetings (Introductions)',
        description: 'Introduce yourself and ask someone\'s name',
        numberOfItems: 3,
        teachings: [
          { id: SEED_UUIDS.teachingPiacere, questionId: SEED_UUIDS.questionPiacere, userLanguageString: 'Nice to meet you', learningLanguageString: 'Piacere', tip: 'Often said when meeting someone for the first time.', emoji: '🤝', variants: [{ deliveryMethod: DELIVERY_METHOD.FLASHCARD, data: { prompt: "Translate 'Piacere' to English", source: 'Piacere', answer: 'Nice to meet you' } }, { deliveryMethod: DELIVERY_METHOD.TEXT_TO_SPEECH, data: { prompt: 'Listen and repeat (speaking)', answer: 'Piacere' } }] },
          { id: SEED_UUIDS.teachingComeTiChiami, questionId: SEED_UUIDS.questionComeTiChiami, userLanguageString: "What's your name?", learningLanguageString: 'Come ti chiami?', tip: 'Informal "What are you called?"', emoji: '❓', variants: [{ deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION, data: { prompt: "Translate 'Come ti chiami?' to English", source: 'Come ti chiami?', answer: "What's your name?" } }, { deliveryMethod: DELIVERY_METHOD.SPEECH_TO_TEXT, data: { prompt: 'Listen and type what you hear', answer: 'Come ti chiami?' } }] },
          { id: SEED_UUIDS.teachingMiChiamo, questionId: SEED_UUIDS.questionMiChiamo, userLanguageString: 'My name is …', learningLanguageString: 'Mi chiamo …', tip: 'Literally "I call myself …". Replace … with your name.', emoji: '🧑‍💼', variants: [{ deliveryMethod: DELIVERY_METHOD.FILL_BLANK, data: { prompt: 'Complete the sentence', text: 'Mi chiamo ___', answer: 'Marco', hint: 'Use any name here.' } }, { deliveryMethod: DELIVERY_METHOD.TEXT_TO_SPEECH, data: { prompt: 'Listen and repeat (speaking)', answer: 'Mi chiamo Marco' } }] },
        ],
      },
      // Basics lessons 4–10
      { id: seedId('lesson', 1, 4), title: 'Please / Thank you / Excuse me', description: 'Politeness phrases for everyday situations', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 1, 4, 1), questionId: seedId('question', 1, 4, 1), userLanguageString: "You're welcome", learningLanguageString: 'Prego', tip: 'The standard response to Grazie.', emoji: '🙏' },
        { id: seedId('teaching', 1, 4, 2), questionId: seedId('question', 1, 4, 2), userLanguageString: 'Excuse me (formal)', learningLanguageString: 'Mi scusi', tip: 'Use to get attention or apologise politely.', emoji: '🙏' },
        { id: seedId('teaching', 1, 4, 3), questionId: seedId('question', 1, 4, 3), userLanguageString: "I'm sorry", learningLanguageString: 'Mi dispiace', tip: 'To apologise or express regret.', emoji: '😔' },
      ]},
      { id: seedId('lesson', 1, 5), title: 'Numbers 1–20', description: 'Count from one to twenty in Italian', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 1, 5, 1), questionId: seedId('question', 1, 5, 1), userLanguageString: 'One, two, three', learningLanguageString: 'Uno, due, tre', tip: 'Essential for counting and ordering.', emoji: '🔢' },
        { id: seedId('teaching', 1, 5, 2), questionId: seedId('question', 1, 5, 2), userLanguageString: 'Ten', learningLanguageString: 'Dieci', tip: 'Base for teens.', emoji: '🔢' },
        { id: seedId('teaching', 1, 5, 3), questionId: seedId('question', 1, 5, 3), userLanguageString: 'Twenty', learningLanguageString: 'Venti', tip: 'Used in time and prices.', emoji: '🔢' },
      ]},
      { id: seedId('lesson', 1, 6), title: 'Numbers 20–100', description: 'Larger numbers for prices and time', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 1, 6, 1), questionId: seedId('question', 1, 6, 1), userLanguageString: 'Fifty', learningLanguageString: 'Cinquanta', tip: 'Common in prices and time.', emoji: '🔢' },
        { id: seedId('teaching', 1, 6, 2), questionId: seedId('question', 1, 6, 2), userLanguageString: 'One hundred', learningLanguageString: 'Cento', tip: 'Essential for money and quantities.', emoji: '🔢' },
        { id: seedId('teaching', 1, 6, 3), questionId: seedId('question', 1, 6, 3), userLanguageString: 'How much?', learningLanguageString: 'Quanto?', tip: 'Short form of Quanto costa?', emoji: '💶' },
      ]},
      { id: seedId('lesson', 1, 7), title: 'Time of day', description: 'Ask and tell the time', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 1, 7, 1), questionId: seedId('question', 1, 7, 1), userLanguageString: "What time is it?", learningLanguageString: "Che ora è?", tip: 'Standard way to ask the time.', emoji: '🕐' },
        { id: seedId('teaching', 1, 7, 2), questionId: seedId('question', 1, 7, 2), userLanguageString: "It's one o'clock", learningLanguageString: "È l'una", tip: 'Note: one o\'clock uses "l\'una".', emoji: '🕐' },
        { id: seedId('teaching', 1, 7, 3), questionId: seedId('question', 1, 7, 3), userLanguageString: "It's three o'clock", learningLanguageString: "Sono le tre", tip: 'Use "sono le" for 2–12.', emoji: '🕐' },
      ]},
      { id: seedId('lesson', 1, 8), title: 'Yes / No / Maybe', description: 'Basic responses', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 1, 8, 1), questionId: seedId('question', 1, 8, 1), userLanguageString: 'Yes', learningLanguageString: 'Sì', tip: 'Always with an accent.', emoji: '✅' },
        { id: seedId('teaching', 1, 8, 2), questionId: seedId('question', 1, 8, 2), userLanguageString: 'No', learningLanguageString: 'No', tip: 'Same as English.', emoji: '❌' },
        { id: seedId('teaching', 1, 8, 3), questionId: seedId('question', 1, 8, 3), userLanguageString: 'Maybe', learningLanguageString: 'Forse', tip: 'Use when unsure.', emoji: '🤷' },
      ]},
      { id: seedId('lesson', 1, 9), title: 'Simple questions', description: 'Everyday questions and answers', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 1, 9, 1), questionId: seedId('question', 1, 9, 1), userLanguageString: 'How are you? (formal)', learningLanguageString: 'Come sta?', tip: 'Polite form. Informal: Come stai?', emoji: '❓' },
        { id: seedId('teaching', 1, 9, 2), questionId: seedId('question', 1, 9, 2), userLanguageString: "I'm fine, thanks", learningLanguageString: 'Bene, grazie', tip: 'Standard reply to Come sta?', emoji: '😊' },
        { id: seedId('teaching', 1, 9, 3), questionId: seedId('question', 1, 9, 3), userLanguageString: 'Excuse me (informal)', learningLanguageString: 'Scusa', tip: 'Use with friends; use Mi scusi with strangers.', emoji: '🙏' },
      ]},
      { id: seedId('lesson', 1, 10), title: 'Recap & practice', description: 'Review essentials from Basics', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 1, 10, 1), questionId: seedId('question', 1, 10, 1), userLanguageString: 'Good night', learningLanguageString: 'Buonanotte', tip: 'Said when going to sleep.', emoji: '🌙' },
        { id: seedId('teaching', 1, 10, 2), questionId: seedId('question', 1, 10, 2), userLanguageString: 'See you later', learningLanguageString: 'A dopo', tip: 'Informal "see you later".', emoji: '👋' },
        { id: seedId('teaching', 1, 10, 3), questionId: seedId('question', 1, 10, 3), userLanguageString: 'Hello (formal)', learningLanguageString: 'Salve', tip: 'Neutral greeting, can be used any time.', emoji: '👋' },
      ]},
    ],
  },
  // —— MODULE 2: Travel ——
  {
    id: SEED_UUIDS.moduleTravel,
    title: 'Travel',
    description: 'Practical phrases for getting around, hotels, and restaurants',
    imageUrl: MODULE_IMAGES.travel,
    category: 'Topics',
    lessons: [
      {
        id: SEED_UUIDS.lessonTravelGettingAround,
        title: 'Getting Around',
        description: 'Tickets, directions, and prices',
        numberOfItems: 3,
        teachings: [
          { id: SEED_UUIDS.teachingDoveSiTrova, questionId: SEED_UUIDS.questionDoveSiTrova, userLanguageString: 'Where is …?', learningLanguageString: 'Dove si trova …?', tip: 'Useful for asking directions.', emoji: '🧭', variants: [{ deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION, data: { prompt: "Translate 'Dove si trova …?' to English", source: 'Dove si trova …?', answer: 'Where is …?' } }, { deliveryMethod: DELIVERY_METHOD.SPEECH_TO_TEXT, data: { prompt: 'Listen and type what you hear', answer: 'Dove si trova …?' } }] },
          { id: SEED_UUIDS.teachingUnBiglietto, questionId: SEED_UUIDS.questionUnBiglietto, userLanguageString: 'A ticket, please', learningLanguageString: 'Un biglietto, per favore', tip: 'Use it for buses, trains, museums.', emoji: '🎟️', variants: [{ deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE, data: { prompt: "How do you say 'A ticket, please'?", options: [{ id: 'opt1', label: 'Un biglietto, per favore', isCorrect: true }, { id: 'opt2', label: 'Quanto costa?', isCorrect: false }, { id: 'opt3', label: 'Il conto, per favore', isCorrect: false }, { id: 'opt4', label: 'Ho una prenotazione', isCorrect: false }] } }, { deliveryMethod: DELIVERY_METHOD.FLASHCARD, data: { prompt: "Translate 'Un biglietto, per favore' to English", source: 'Un biglietto, per favore', answer: 'A ticket, please' } }] },
          { id: SEED_UUIDS.teachingQuantoCosta, questionId: SEED_UUIDS.questionQuantoCosta, userLanguageString: 'How much does it cost?', learningLanguageString: 'Quanto costa?', tip: 'A classic question when shopping or buying tickets.', emoji: '💶', variants: [{ deliveryMethod: DELIVERY_METHOD.FLASHCARD, data: { prompt: "Translate 'Quanto costa?' to English", source: 'Quanto costa?', answer: 'How much does it cost?' } }, { deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE, data: { prompt: "How do you say 'How much does it cost?'?", options: [{ id: 'opt1', label: 'Quanto costa?', isCorrect: true }, { id: 'opt2', label: 'Dove si trova …?', isCorrect: false }, { id: 'opt3', label: 'Grazie', isCorrect: false }, { id: 'opt4', label: 'Per favore', isCorrect: false }] } }] },
        ],
      },
      {
        id: SEED_UUIDS.lessonTravelAccommodation,
        title: 'Accommodation',
        description: 'Hotel check-in and essentials',
        numberOfItems: 3,
        teachings: [
          { id: SEED_UUIDS.teachingHoUnaPrenotazione, questionId: SEED_UUIDS.questionHoUnaPrenotazione, userLanguageString: 'I have a reservation', learningLanguageString: 'Ho una prenotazione', tip: 'Say this at hotel check-in.', emoji: '🏨', variants: [{ deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION, data: { prompt: "Translate 'Ho una prenotazione' to English", source: 'Ho una prenotazione', answer: 'I have a reservation' } }, { deliveryMethod: DELIVERY_METHOD.TEXT_TO_SPEECH, data: { prompt: 'Listen and repeat (speaking)', answer: 'Ho una prenotazione' } }] },
          { id: SEED_UUIDS.teachingLaChiave, questionId: SEED_UUIDS.questionLaChiave, userLanguageString: 'The key', learningLanguageString: 'La chiave', tip: 'You might hear: "Ecco la chiave."', emoji: '🔑', variants: [{ deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE, data: { prompt: "What does 'La chiave' mean?", options: [{ id: 'opt1', label: 'The key', isCorrect: true }, { id: 'opt2', label: 'The bill', isCorrect: false }, { id: 'opt3', label: 'The bathroom', isCorrect: false }, { id: 'opt4', label: 'The ticket', isCorrect: false }] } }, { deliveryMethod: DELIVERY_METHOD.FLASHCARD, data: { prompt: "Translate 'La chiave' to English", source: 'La chiave', answer: 'The key' } }] },
          { id: SEED_UUIDS.teachingDoveIlBagno, questionId: SEED_UUIDS.questionDoveIlBagno, userLanguageString: 'Where is the bathroom?', learningLanguageString: "Dov'è il bagno?", tip: 'Super useful in any trip.', emoji: '🚻', variants: [{ deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION, data: { prompt: "Translate \"Dov'è il bagno?\" to English", source: "Dov'è il bagno?", answer: 'Where is the bathroom?' } }, { deliveryMethod: DELIVERY_METHOD.SPEECH_TO_TEXT, data: { prompt: 'Listen and type what you hear', answer: "Dov'è il bagno?" } }] },
        ],
      },
      {
        id: SEED_UUIDS.lessonTravelDining,
        title: 'Dining Out',
        description: 'Ordering and paying at restaurants',
        numberOfItems: 3,
        teachings: [
          { id: SEED_UUIDS.teachingIlConto, questionId: SEED_UUIDS.questionIlConto, userLanguageString: 'The bill, please', learningLanguageString: 'Il conto, per favore', tip: 'Ask to pay at a restaurant.', emoji: '🧾', variants: [{ deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION, data: { prompt: "Translate 'Il conto, per favore' to English", source: 'Il conto, per favore', answer: 'The bill, please' } }, { deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE, data: { prompt: "How do you say 'The bill, please'?", options: [{ id: 'opt1', label: 'Il conto, per favore', isCorrect: true }, { id: 'opt2', label: 'Un biglietto, per favore', isCorrect: false }, { id: 'opt3', label: 'Ho una prenotazione', isCorrect: false }, { id: 'opt4', label: 'Buonasera', isCorrect: false }] } }] },
          { id: SEED_UUIDS.teachingAcqua, questionId: SEED_UUIDS.questionAcqua, userLanguageString: 'Water', learningLanguageString: 'Acqua', tip: 'Acqua naturale (still) / Acqua frizzante (sparkling).', emoji: '💧', variants: [{ deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE, data: { prompt: "What does 'Acqua' mean?", options: [{ id: 'opt1', label: 'Water', isCorrect: true }, { id: 'opt2', label: 'Wine', isCorrect: false }, { id: 'opt3', label: 'Coffee', isCorrect: false }, { id: 'opt4', label: 'Tea', isCorrect: false }] } }, { deliveryMethod: DELIVERY_METHOD.FLASHCARD, data: { prompt: "Translate 'Acqua' to English", source: 'Acqua', answer: 'Water' } }] },
          { id: SEED_UUIDS.teachingSonoAllergico, questionId: SEED_UUIDS.questionSonoAllergico, userLanguageString: 'I am allergic to …', learningLanguageString: 'Sono allergico/a a …', tip: 'Add the allergen (e.g., "le noci").', emoji: '⚠️', variants: [{ deliveryMethod: DELIVERY_METHOD.FLASHCARD, data: { prompt: "Translate 'Sono allergico/a a …' to English", source: 'Sono allergico/a a …', answer: 'I am allergic to …' } }, { deliveryMethod: DELIVERY_METHOD.TEXT_TO_SPEECH, data: { prompt: 'Listen and repeat (speaking)', answer: 'Sono allergico a …' } }] },
        ],
      },
      // Travel lessons 4–10
      { id: seedId('lesson', 2, 4), title: 'Tickets & prices', description: 'Buying tickets and asking prices', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 2, 4, 1), questionId: seedId('question', 2, 4, 1), userLanguageString: 'Where are the bags?', learningLanguageString: 'Dove sono i bagagli?', tip: 'At the airport or station.', emoji: '🧳' },
        { id: seedId('teaching', 2, 4, 2), questionId: seedId('question', 2, 4, 2), userLanguageString: 'What time does the train leave?', learningLanguageString: 'A che ora parte il treno?', tip: 'Essential for travel.', emoji: '🚂' },
        { id: seedId('teaching', 2, 4, 3), questionId: seedId('question', 2, 4, 3), userLanguageString: 'Where is the station?', learningLanguageString: "Dov'è la stazione?", tip: 'Train or bus station.', emoji: '🚉' },
      ]},
      { id: seedId('lesson', 2, 5), title: 'Directions', description: 'Asking and understanding directions', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 2, 5, 1), questionId: seedId('question', 2, 5, 1), userLanguageString: 'Excuse me, how do I get to…?', learningLanguageString: 'Mi scusi, come arrivo a…?', tip: 'Fill in the place.', emoji: '🧭' },
        { id: seedId('teaching', 2, 5, 2), questionId: seedId('question', 2, 5, 2), userLanguageString: 'Is it far?', learningLanguageString: 'È lontano?', tip: 'Simple yes/no question.', emoji: '📍' },
        { id: seedId('teaching', 2, 5, 3), questionId: seedId('question', 2, 5, 3), userLanguageString: 'Straight ahead', learningLanguageString: 'Sempre dritto', tip: 'Common direction.', emoji: '➡️' },
      ]},
      { id: seedId('lesson', 2, 6), title: 'Check-in', description: 'Hotel and accommodation check-in', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 2, 6, 1), questionId: seedId('question', 2, 6, 1), userLanguageString: 'I would like a double room', learningLanguageString: 'Vorrei una camera doppia', tip: 'Standard request at a hotel.', emoji: '🛏️' },
        { id: seedId('teaching', 2, 6, 2), questionId: seedId('question', 2, 6, 2), userLanguageString: 'Is Wi‑Fi free?', learningLanguageString: 'Il Wi-Fi è gratuito?', tip: 'Common question.', emoji: '📶' },
        { id: seedId('teaching', 2, 6, 3), questionId: seedId('question', 2, 6, 3), userLanguageString: 'What time is checkout?', learningLanguageString: 'A che ora è il check-out?', tip: 'Often 10 or 11 in Italy.', emoji: '🕐' },
      ]},
      { id: seedId('lesson', 2, 7), title: 'Hotel essentials', description: 'Things you need at the hotel', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 2, 7, 1), questionId: seedId('question', 2, 7, 1), userLanguageString: 'I need an extra towel', learningLanguageString: 'Ho bisogno di un asciugamano in più', tip: 'Ho bisogno di = I need.', emoji: '🛁' },
        { id: seedId('teaching', 2, 7, 2), questionId: seedId('question', 2, 7, 2), userLanguageString: 'The room is too hot', learningLanguageString: 'La stanza è troppo calda', tip: 'Troppo = too.', emoji: '🌡️' },
        { id: seedId('teaching', 2, 7, 3), questionId: seedId('question', 2, 7, 3), userLanguageString: 'Does the room have a view?', learningLanguageString: 'La stanza ha una vista?', tip: 'Useful when booking.', emoji: '🪟' },
      ]},
      { id: seedId('lesson', 2, 8), title: 'Ordering drinks', description: 'At the bar or café', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 2, 8, 1), questionId: seedId('question', 2, 8, 1), userLanguageString: 'A coffee, please', learningLanguageString: 'Un caffè, per favore', tip: 'In Italy often drunk standing at the bar.', emoji: '☕' },
        { id: seedId('teaching', 2, 8, 2), questionId: seedId('question', 2, 8, 2), userLanguageString: 'Can I have the menu?', learningLanguageString: 'Posso avere il menu?', tip: 'Polite way to ask.', emoji: '📋' },
        { id: seedId('teaching', 2, 8, 3), questionId: seedId('question', 2, 8, 3), userLanguageString: 'A glass of wine', learningLanguageString: 'Un bicchiere di vino', tip: 'Red = rosso, white = bianco.', emoji: '🍷' },
      ]},
      { id: seedId('lesson', 2, 9), title: 'The bill & paying', description: 'Paying at restaurants and shops', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 2, 9, 1), questionId: seedId('question', 2, 9, 1), userLanguageString: 'Can I pay by card?', learningLanguageString: 'Posso pagare con la carta?', tip: 'Many places prefer cash.', emoji: '💳' },
        { id: seedId('teaching', 2, 9, 2), questionId: seedId('question', 2, 9, 2), userLanguageString: 'Is service included?', learningLanguageString: 'Il servizio è incluso?', tip: 'Often yes in Italy.', emoji: '🧾' },
        { id: seedId('teaching', 2, 9, 3), questionId: seedId('question', 2, 9, 3), userLanguageString: 'Keep the change', learningLanguageString: 'Tenga il resto', tip: 'Polite when leaving a tip.', emoji: '💰' },
      ]},
      { id: seedId('lesson', 2, 10), title: 'Emergencies & help', description: 'When you need help', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 2, 10, 1), questionId: seedId('question', 2, 10, 1), userLanguageString: 'Help!', learningLanguageString: 'Aiuto!', tip: 'Emergency.', emoji: '🆘' },
        { id: seedId('teaching', 2, 10, 2), questionId: seedId('question', 2, 10, 2), userLanguageString: "I don't understand", learningLanguageString: 'Non capisco', tip: 'Ask for clarification.', emoji: '❓' },
        { id: seedId('teaching', 2, 10, 3), questionId: seedId('question', 2, 10, 3), userLanguageString: 'Do you speak English?', learningLanguageString: 'Parla inglese?', tip: 'Formal. Informal: Parli inglese?', emoji: '🗣️' },
      ]},
    ],
  },
  // —— MODULE 3: Daily Life ——
  {
    id: seedId('module', 3),
    title: 'Daily Life',
    description: 'Routines, weather, shopping, and life in town',
    imageUrl: MODULE_IMAGES.dailyLife,
    category: 'Daily Life',
    lessons: [
      { id: seedId('lesson', 3, 1), title: 'Daily routine', description: 'Talking about your day', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 3, 1, 1), questionId: seedId('question', 3, 1, 1), userLanguageString: 'I get up at…', learningLanguageString: 'Mi alzo alle…', tip: 'Add the time (e.g. alle sette).', emoji: '⏰' },
        { id: seedId('teaching', 3, 1, 2), questionId: seedId('question', 3, 1, 2), userLanguageString: 'I have breakfast', learningLanguageString: 'Faccio colazione', tip: 'Fare colazione = to have breakfast.', emoji: '🥐' },
        { id: seedId('teaching', 3, 1, 3), questionId: seedId('question', 3, 1, 3), userLanguageString: 'I go to work', learningLanguageString: 'Vado al lavoro', tip: 'Andare al lavoro.', emoji: '💼' },
      ]},
      { id: seedId('lesson', 3, 2), title: 'Time & schedule', description: 'Telling time and making plans', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 3, 2, 1), questionId: seedId('question', 3, 2, 1), userLanguageString: 'At what time?', learningLanguageString: 'A che ora?', tip: 'Standard question.', emoji: '🕐' },
        { id: seedId('teaching', 3, 2, 2), questionId: seedId('question', 3, 2, 2), userLanguageString: 'In the morning', learningLanguageString: 'Di mattina', tip: 'Also: di pomeriggio, di sera.', emoji: '🌅' },
        { id: seedId('teaching', 3, 2, 3), questionId: seedId('question', 3, 2, 3), userLanguageString: "I'm in a hurry", learningLanguageString: 'Ho fretta', tip: 'Common excuse.', emoji: '⏱️' },
      ]},
      { id: seedId('lesson', 3, 3), title: 'Weather', description: 'Talking about the weather', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 3, 3, 1), questionId: seedId('question', 3, 3, 1), userLanguageString: "What's the weather like?", learningLanguageString: 'Che tempo fa?', tip: 'Standard question.', emoji: '🌤️' },
        { id: seedId('teaching', 3, 3, 2), questionId: seedId('question', 3, 3, 2), userLanguageString: "It's sunny", learningLanguageString: 'C\'è il sole', tip: 'C\'è = there is.', emoji: '☀️' },
        { id: seedId('teaching', 3, 3, 3), questionId: seedId('question', 3, 3, 3), userLanguageString: "It's raining", learningLanguageString: 'Piove', tip: 'Piovere = to rain.', emoji: '🌧️' },
      ]},
      { id: seedId('lesson', 3, 4), title: 'Shopping basics', description: 'Essential shopping phrases', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 3, 4, 1), questionId: seedId('question', 3, 4, 1), userLanguageString: 'How much does this cost?', learningLanguageString: 'Quanto costa questo?', tip: 'Questo = this.', emoji: '🛒' },
        { id: seedId('teaching', 3, 4, 2), questionId: seedId('question', 3, 4, 2), userLanguageString: "I'm just looking", learningLanguageString: 'Sto solo guardando', tip: 'Politely decline help.', emoji: '👀' },
        { id: seedId('teaching', 3, 4, 3), questionId: seedId('question', 3, 4, 3), userLanguageString: "I'll take it", learningLanguageString: 'Lo prendo', tip: 'To buy it.', emoji: '✅' },
      ]},
      { id: seedId('lesson', 3, 5), title: 'At the market', description: 'Buying food at the market', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 3, 5, 1), questionId: seedId('question', 3, 5, 1), userLanguageString: 'Half a kilo, please', learningLanguageString: 'Mezzo chilo, per favore', tip: 'Common at fruit/cheese counters.', emoji: '⚖️' },
        { id: seedId('teaching', 3, 5, 2), questionId: seedId('question', 3, 5, 2), userLanguageString: 'Is it fresh?', learningLanguageString: 'È fresco?', tip: 'Fresco = fresh.', emoji: '🥬' },
        { id: seedId('teaching', 3, 5, 3), questionId: seedId('question', 3, 5, 3), userLanguageString: 'That\'s all, thanks', learningLanguageString: 'È tutto, grazie', tip: 'When you\'re done.', emoji: '🙏' },
      ]},
      { id: seedId('lesson', 3, 6), title: 'Clothes & sizes', description: 'Shopping for clothes', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 3, 6, 1), questionId: seedId('question', 3, 6, 1), userLanguageString: 'Do you have a larger size?', learningLanguageString: 'Ha una taglia più grande?', tip: 'Ha = formal you have.', emoji: '👕' },
        { id: seedId('teaching', 3, 6, 2), questionId: seedId('question', 3, 6, 2), userLanguageString: 'Can I try it on?', learningLanguageString: 'Posso provarlo?', tip: 'Provare = to try.', emoji: '👗' },
        { id: seedId('teaching', 3, 6, 3), questionId: seedId('question', 3, 6, 3), userLanguageString: 'Where are the changing rooms?', learningLanguageString: 'Dove sono i camerini?', tip: 'Camerino = fitting room.', emoji: '🚪' },
      ]},
      { id: seedId('lesson', 3, 7), title: 'Phone & communication', description: 'Using the phone', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 3, 7, 1), questionId: seedId('question', 3, 7, 1), userLanguageString: 'Hello (on the phone)', learningLanguageString: 'Pronto', tip: 'Italians say Pronto when answering.', emoji: '📞' },
        { id: seedId('teaching', 3, 7, 2), questionId: seedId('question', 3, 7, 2), userLanguageString: "Who's calling?", learningLanguageString: 'Chi parla?', tip: 'Literal: Who is speaking?', emoji: '📱' },
        { id: seedId('teaching', 3, 7, 3), questionId: seedId('question', 3, 7, 3), userLanguageString: "I'll call back later", learningLanguageString: 'Richiamo più tardi', tip: 'Richiamare = to call back.', emoji: '📲' },
      ]},
      { id: seedId('lesson', 3, 8), title: 'Post office', description: 'Sending mail and parcels', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 3, 8, 1), questionId: seedId('question', 3, 8, 1), userLanguageString: 'I would like to send a letter', learningLanguageString: 'Vorrei inviare una lettera', tip: 'Inviare = to send.', emoji: '✉️' },
        { id: seedId('teaching', 3, 8, 2), questionId: seedId('question', 3, 8, 2), userLanguageString: 'How much is the stamp?', learningLanguageString: 'Quanto costa il francobollo?', tip: 'Francobollo = stamp.', emoji: '📮' },
        { id: seedId('teaching', 3, 8, 3), questionId: seedId('question', 3, 8, 3), userLanguageString: 'To the UK', learningLanguageString: 'Per il Regno Unito', tip: 'Per = to (destination).', emoji: '🇬🇧' },
      ]},
      { id: seedId('lesson', 3, 9), title: 'Transport in town', description: 'Buses and local transport', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 3, 9, 1), questionId: seedId('question', 3, 9, 1), userLanguageString: 'Where is the bus stop?', learningLanguageString: 'Dove si trova la fermata?', tip: 'Fermata = stop.', emoji: '🚌' },
        { id: seedId('teaching', 3, 9, 2), questionId: seedId('question', 3, 9, 2), userLanguageString: 'When do we leave?', learningLanguageString: 'Quando partiamo?', tip: 'Partire = to leave/depart.', emoji: '🚏' },
        { id: seedId('teaching', 3, 9, 3), questionId: seedId('question', 3, 9, 3), userLanguageString: 'One ticket for the metro', learningLanguageString: 'Un biglietto per la metropolitana', tip: 'Often shortened to metro.', emoji: '🚇' },
      ]},
      { id: seedId('lesson', 3, 10), title: 'Making plans', description: 'Suggesting and arranging', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 3, 10, 1), questionId: seedId('question', 3, 10, 1), userLanguageString: 'Shall we have a coffee?', learningLanguageString: 'Facciamo un caffè?', tip: 'Facciamo = let\'s do.', emoji: '☕' },
        { id: seedId('teaching', 3, 10, 2), questionId: seedId('question', 3, 10, 2), userLanguageString: 'Are you free tomorrow?', learningLanguageString: 'Sei libero domani?', tip: 'Libero = free (for a man).', emoji: '📅' },
        { id: seedId('teaching', 3, 10, 3), questionId: seedId('question', 3, 10, 3), userLanguageString: "That sounds good", learningLanguageString: 'Mi va bene', tip: 'Literally: it works for me.', emoji: '👍' },
      ]},
    ],
  },
  // —— MODULE 4: Food & Dining ——
  {
    id: seedId('module', 4),
    title: 'Food & Dining',
    description: 'Meals, ordering, drinks, and Italian food culture',
    imageUrl: MODULE_IMAGES.foodDining,
    category: 'Food & Culture',
    lessons: [
      { id: seedId('lesson', 4, 1), title: 'Breakfast', description: 'Starting the day Italian-style', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 4, 1, 1), questionId: seedId('question', 4, 1, 1), userLanguageString: 'Breakfast', learningLanguageString: 'La colazione', tip: 'Usually light: caffè e cornetto.', emoji: '🥐' },
        { id: seedId('teaching', 4, 1, 2), questionId: seedId('question', 4, 1, 2), userLanguageString: 'A coffee and a croissant', learningLanguageString: 'Un caffè e un cornetto', tip: 'Classic Italian breakfast.', emoji: '☕' },
        { id: seedId('teaching', 4, 1, 3), questionId: seedId('question', 4, 1, 3), userLanguageString: 'With milk', learningLanguageString: 'Con latte', tip: 'Caffè latte = coffee with milk.', emoji: '🥛' },
      ]},
      { id: seedId('lesson', 4, 2), title: 'Lunch & dinner', description: 'Main meals', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 4, 2, 1), questionId: seedId('question', 4, 2, 1), userLanguageString: 'Lunch', learningLanguageString: 'Il pranzo', tip: 'The main meal for many Italians.', emoji: '🍝' },
        { id: seedId('teaching', 4, 2, 2), questionId: seedId('question', 4, 2, 2), userLanguageString: 'Dinner', learningLanguageString: 'La cena', tip: 'Evening meal.', emoji: '🍷' },
        { id: seedId('teaching', 4, 2, 3), questionId: seedId('question', 4, 2, 3), userLanguageString: "I'm hungry", learningLanguageString: 'Ho fame', tip: 'Ho fame = I have hunger.', emoji: '🍽️' },
      ]},
      { id: seedId('lesson', 4, 3), title: 'At the bar', description: 'Ordering at an Italian bar', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 4, 3, 1), questionId: seedId('question', 4, 3, 1), userLanguageString: 'A coffee (espresso)', learningLanguageString: 'Un caffè', tip: 'In Italy un caffè is espresso.', emoji: '☕' },
        { id: seedId('teaching', 4, 3, 2), questionId: seedId('question', 4, 3, 2), userLanguageString: 'At the bar or at the table?', learningLanguageString: 'Al banco o al tavolo?', tip: 'Cheaper at the bar.', emoji: '🍴' },
        { id: seedId('teaching', 4, 3, 3), questionId: seedId('question', 4, 3, 3), userLanguageString: 'A small beer', learningLanguageString: 'Una birra piccola', tip: 'Piccola = small.', emoji: '🍺' },
      ]},
      { id: seedId('lesson', 4, 4), title: 'Ordering food', description: 'At the restaurant', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 4, 4, 1), questionId: seedId('question', 4, 4, 1), userLanguageString: 'I would like…', learningLanguageString: 'Vorrei…', tip: 'Polite way to order.', emoji: '📋' },
        { id: seedId('teaching', 4, 4, 2), questionId: seedId('question', 4, 4, 2), userLanguageString: 'What do you recommend?', learningLanguageString: 'Cosa mi consiglia?', tip: 'Consigliare = to recommend.', emoji: '👨‍🍳' },
        { id: seedId('teaching', 4, 4, 3), questionId: seedId('question', 4, 4, 3), userLanguageString: 'The daily special', learningLanguageString: 'Il piatto del giorno', tip: 'Often good value.', emoji: '🍲' },
      ]},
      { id: seedId('lesson', 4, 5), title: 'Drinks', description: 'Wine, water, and more', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 4, 5, 1), questionId: seedId('question', 4, 5, 1), userLanguageString: 'A glass of red wine', learningLanguageString: 'Un bicchiere di vino rosso', tip: 'Rosso = red, bianco = white.', emoji: '🍷' },
        { id: seedId('teaching', 4, 5, 2), questionId: seedId('question', 4, 5, 2), userLanguageString: 'Still or sparkling water?', learningLanguageString: 'Acqua naturale o frizzante?', tip: 'Naturale = still.', emoji: '💧' },
        { id: seedId('teaching', 4, 5, 3), questionId: seedId('question', 4, 5, 3), userLanguageString: 'An orange juice', learningLanguageString: 'Un succo d\'arancia', tip: 'Succo = juice.', emoji: '🍊' },
      ]},
      { id: seedId('lesson', 4, 6), title: 'Allergies & diet', description: 'Dietary requirements', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 4, 6, 1), questionId: seedId('question', 4, 6, 1), userLanguageString: "I'm vegetarian", learningLanguageString: 'Sono vegetariano/a', tip: 'Use -a if you\'re female.', emoji: '🥗' },
        { id: seedId('teaching', 4, 6, 2), questionId: seedId('question', 4, 6, 2), userLanguageString: "I don't eat gluten", learningLanguageString: 'Non mangio glutine', tip: 'Senza glutine = gluten-free.', emoji: '🌾' },
        { id: seedId('teaching', 4, 6, 3), questionId: seedId('question', 4, 6, 3), userLanguageString: 'Does it contain nuts?', learningLanguageString: 'Contiene noci?', tip: 'Contenere = to contain.', emoji: '🥜' },
      ]},
      { id: seedId('lesson', 4, 7), title: 'Paying at restaurant', description: 'Bill and tips', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 4, 7, 1), questionId: seedId('question', 4, 7, 1), userLanguageString: 'The bill, please', learningLanguageString: 'Il conto, per favore', tip: 'Same as in Travel module.', emoji: '🧾' },
        { id: seedId('teaching', 4, 7, 2), questionId: seedId('question', 4, 7, 2), userLanguageString: 'Together or separate?', learningLanguageString: 'Insieme o separato?', tip: 'Insieme = together.', emoji: '💳' },
        { id: seedId('teaching', 4, 7, 3), questionId: seedId('question', 4, 7, 3), userLanguageString: "We'll pay together", learningLanguageString: 'Paghiamo insieme', tip: 'Paghiamo = we pay.', emoji: '👥' },
      ]},
      { id: seedId('lesson', 4, 8), title: 'Food vocabulary', description: 'Common food words', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 4, 8, 1), questionId: seedId('question', 4, 8, 1), userLanguageString: 'Bread', learningLanguageString: 'Il pane', tip: 'Often brought to the table.', emoji: '🍞' },
        { id: seedId('teaching', 4, 8, 2), questionId: seedId('question', 4, 8, 2), userLanguageString: 'Cheese', learningLanguageString: 'Il formaggio', tip: 'Italy has hundreds of varieties.', emoji: '🧀' },
        { id: seedId('teaching', 4, 8, 3), questionId: seedId('question', 4, 8, 3), userLanguageString: 'Dessert', learningLanguageString: 'Il dolce', tip: 'Dolce = sweet.', emoji: '🍰' },
      ]},
      { id: seedId('lesson', 4, 9), title: 'At the supermarket', description: 'Shopping for food', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 4, 9, 1), questionId: seedId('question', 4, 9, 1), userLanguageString: 'Where is the milk?', learningLanguageString: 'Dove si trova il latte?', tip: 'Same structure as other "where" questions.', emoji: '🥛' },
        { id: seedId('teaching', 4, 9, 2), questionId: seedId('question', 4, 9, 2), userLanguageString: 'Do you have…?', learningLanguageString: 'Avete…?', tip: 'Avete = you (plural) have.', emoji: '🛒' },
        { id: seedId('teaching', 4, 9, 3), questionId: seedId('question', 4, 9, 3), userLanguageString: 'Expiry date', learningLanguageString: 'Data di scadenza', tip: 'Important on packaged food.', emoji: '📅' },
      ]},
      { id: seedId('lesson', 4, 10), title: 'Italian meals & culture', description: 'Phrases and customs', numberOfItems: 3, teachings: [
        { id: seedId('teaching', 4, 10, 1), questionId: seedId('question', 4, 10, 1), userLanguageString: 'Enjoy your meal', learningLanguageString: 'Buon appetito', tip: 'Said before eating.', emoji: '🍽️' },
        { id: seedId('teaching', 4, 10, 2), questionId: seedId('question', 4, 10, 2), userLanguageString: 'Cheers!', learningLanguageString: 'Salute!', tip: 'Or: Cin cin!', emoji: '🥂' },
        { id: seedId('teaching', 4, 10, 3), questionId: seedId('question', 4, 10, 3), userLanguageString: 'It was delicious', learningLanguageString: 'Era delizioso', tip: 'Era = it was.', emoji: '😋' },
      ]},
    ],
  },
];

async function main() {
  console.log('🌱 Starting seed (4 modules × 10 lessons)...');

  for (const mod of CONTENT_MANIFEST) {
    await prisma.module.upsert({
      where: { id: mod.id },
      update: { title: mod.title, description: mod.description, imageUrl: mod.imageUrl, category: mod.category },
      create: { id: mod.id, title: mod.title, description: mod.description, imageUrl: mod.imageUrl, category: mod.category },
    });
    console.log('✅ Module:', mod.title);

    for (const lesson of mod.lessons) {
      await prisma.lesson.upsert({
        where: { id: lesson.id },
        update: { title: lesson.title, description: lesson.description || null, moduleId: mod.id, numberOfItems: lesson.numberOfItems },
        create: { id: lesson.id, title: lesson.title, description: lesson.description || null, moduleId: mod.id, numberOfItems: lesson.numberOfItems },
      });

      for (const t of lesson.teachings) {
        await prisma.teaching.upsert({
          where: { id: t.id },
          update: {
            knowledgeLevel: KNOWLEDGE_LEVEL.A1,
            emoji: t.emoji || null,
            userLanguageString: t.userLanguageString,
            learningLanguageString: t.learningLanguageString,
            tip: t.tip || null,
            lessonId: lesson.id,
          },
          create: {
            id: t.id,
            knowledgeLevel: KNOWLEDGE_LEVEL.A1,
            emoji: t.emoji || null,
            userLanguageString: t.userLanguageString,
            learningLanguageString: t.learningLanguageString,
            tip: t.tip || null,
            lessonId: lesson.id,
          },
        });

        const variants = t.variants || buildVariants(t);
        await upsertQuestionWithVariants(t.questionId, t.id, variants);
      }
    }
  }

  const [moduleCount, lessonCount, teachingCount] = await Promise.all([
    prisma.module.count(),
    prisma.lesson.count(),
    prisma.teaching.count(),
  ]);
  console.log(`📊 DB: ${moduleCount} modules, ${lessonCount} lessons, ${teachingCount} teachings`);
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
