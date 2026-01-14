import { PrismaClient, KNOWLEDGE_LEVEL, DELIVERY_METHOD } from '@prisma/client';

const prisma = new PrismaClient();

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
      title: 'Italian Basics',
      description: 'Essential Italian phrases and greetings for beginners',
      imageUrl: 'https://example.com/images/italian-basics.jpg',
    },
    create: {
      id: SEED_UUIDS.module,
      title: 'Italian Basics',
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
      learningLanguageAudioUrl: 'https://example.com/audio/ciao.mp3',
      tip: 'Ciao is used both for greeting and saying goodbye in informal situations.',
      lessonId: SEED_UUIDS.lesson,
    },
    create: {
      id: SEED_UUIDS.teachingCiao,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '👋',
      userLanguageString: 'Hi / Bye',
      learningLanguageString: 'Ciao',
      learningLanguageAudioUrl: 'https://example.com/audio/ciao.mp3',
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
      learningLanguageAudioUrl: 'https://example.com/audio/grazie.mp3',
      tip: 'Grazie is the standard way to say thank you. You can also say "Grazie mille" (thanks a lot).',
      lessonId: SEED_UUIDS.lesson,
    },
    create: {
      id: SEED_UUIDS.teachingGrazie,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🙏',
      userLanguageString: 'Thank you',
      learningLanguageString: 'Grazie',
      learningLanguageAudioUrl: 'https://example.com/audio/grazie.mp3',
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
      learningLanguageAudioUrl: 'https://example.com/audio/per-favore.mp3',
      tip: 'Per favore is used when making a request. It literally means "for favor".',
      lessonId: SEED_UUIDS.lesson,
    },
    create: {
      id: SEED_UUIDS.teachingPerFavore,
      knowledgeLevel: KNOWLEDGE_LEVEL.A1,
      emoji: '🙏',
      userLanguageString: 'Please',
      learningLanguageString: 'Per favore',
      learningLanguageAudioUrl: 'https://example.com/audio/per-favore.mp3',
      tip: 'Per favore is used when making a request. It literally means "for favor".',
      lessonId: SEED_UUIDS.lesson,
    },
  });
  console.log('✅ Teaching created/updated: Per favore');

  // 4. Upsert Questions and their delivery methods
  // Question 1: Ciao - Multiple Choice (EN→IT)
  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionCiaoMultipleChoice },
    update: {
      teachingId: SEED_UUIDS.teachingCiao,
    },
    create: {
      id: SEED_UUIDS.questionCiaoMultipleChoice,
      teachingId: SEED_UUIDS.teachingCiao,
    },
  });
  // Upsert delivery method for multiple choice (delete + create for idempotency)
  await prisma.questionDeliveryMethod.deleteMany({
    where: {
      questionId: SEED_UUIDS.questionCiaoMultipleChoice,
      deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE,
    },
  });
  await prisma.questionDeliveryMethod.create({
    data: {
      questionId: SEED_UUIDS.questionCiaoMultipleChoice,
      deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE,
    },
  });
  console.log('✅ Question created/updated: Ciao (Multiple Choice)');

  // Question 2: Ciao - Translation (IT→EN)
  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionCiaoTranslation },
    update: {
      teachingId: SEED_UUIDS.teachingCiao,
    },
    create: {
      id: SEED_UUIDS.questionCiaoTranslation,
      teachingId: SEED_UUIDS.teachingCiao,
    },
  });
  await prisma.questionDeliveryMethod.deleteMany({
    where: {
      questionId: SEED_UUIDS.questionCiaoTranslation,
      deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION,
    },
  });
  await prisma.questionDeliveryMethod.create({
    data: {
      questionId: SEED_UUIDS.questionCiaoTranslation,
      deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION,
    },
  });
  console.log('✅ Question created/updated: Ciao (Translation)');

  // Question 3: Ciao - Listening (Speech to Text)
  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionCiaoListening },
    update: {
      teachingId: SEED_UUIDS.teachingCiao,
    },
    create: {
      id: SEED_UUIDS.questionCiaoListening,
      teachingId: SEED_UUIDS.teachingCiao,
    },
  });
  await prisma.questionDeliveryMethod.deleteMany({
    where: {
      questionId: SEED_UUIDS.questionCiaoListening,
      deliveryMethod: DELIVERY_METHOD.SPEECH_TO_TEXT,
    },
  });
  await prisma.questionDeliveryMethod.create({
    data: {
      questionId: SEED_UUIDS.questionCiaoListening,
      deliveryMethod: DELIVERY_METHOD.SPEECH_TO_TEXT,
    },
  });
  console.log('✅ Question created/updated: Ciao (Listening)');

  // Question 4: Grazie - Multiple Choice (EN→IT)
  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionGrazieMultipleChoice },
    update: {
      teachingId: SEED_UUIDS.teachingGrazie,
    },
    create: {
      id: SEED_UUIDS.questionGrazieMultipleChoice,
      teachingId: SEED_UUIDS.teachingGrazie,
    },
  });
  await prisma.questionDeliveryMethod.deleteMany({
    where: {
      questionId: SEED_UUIDS.questionGrazieMultipleChoice,
      deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE,
    },
  });
  await prisma.questionDeliveryMethod.create({
    data: {
      questionId: SEED_UUIDS.questionGrazieMultipleChoice,
      deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE,
    },
  });
  console.log('✅ Question created/updated: Grazie (Multiple Choice)');

  // Question 5: Grazie - Fill in the Blank
  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionGrazieFillBlank },
    update: {
      teachingId: SEED_UUIDS.teachingGrazie,
    },
    create: {
      id: SEED_UUIDS.questionGrazieFillBlank,
      teachingId: SEED_UUIDS.teachingGrazie,
    },
  });
  await prisma.questionDeliveryMethod.deleteMany({
    where: {
      questionId: SEED_UUIDS.questionGrazieFillBlank,
      deliveryMethod: DELIVERY_METHOD.FILL_BLANK,
    },
  });
  await prisma.questionDeliveryMethod.create({
    data: {
      questionId: SEED_UUIDS.questionGrazieFillBlank,
      deliveryMethod: DELIVERY_METHOD.FILL_BLANK,
    },
  });
  console.log('✅ Question created/updated: Grazie (Fill Blank)');

  // Question 6: Per favore - Translation (EN→IT)
  await prisma.question.upsert({
    where: { id: SEED_UUIDS.questionPerFavoreTranslation },
    update: {
      teachingId: SEED_UUIDS.teachingPerFavore,
    },
    create: {
      id: SEED_UUIDS.questionPerFavoreTranslation,
      teachingId: SEED_UUIDS.teachingPerFavore,
    },
  });
  await prisma.questionDeliveryMethod.deleteMany({
    where: {
      questionId: SEED_UUIDS.questionPerFavoreTranslation,
      deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION,
    },
  });
  await prisma.questionDeliveryMethod.create({
    data: {
      questionId: SEED_UUIDS.questionPerFavoreTranslation,
      deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION,
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
  });
