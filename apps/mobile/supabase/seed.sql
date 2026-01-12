-- Lessons (CEFR A1 Italian)
insert into public.lessons (id, name, title, description, cefr_level, display_order) values
  (1, 'Basics', 'Basics', 'Basic greetings, introductions, and courtesy phrases.', 'A1', 1),
  (2, 'Travel', 'Travel', 'Travel essentials: directions, transportation, and common phrases.', 'A1', 2),
  (3, 'Food', 'Food', 'Food and dining basics.', 'A1', 3),
  (4, 'Family', 'Family', 'Talking about family and people.', 'A1', 4),
  (5, 'Shopping', 'Shopping', 'Shopping, numbers, and currency.', 'A1', 5),
  (6, 'Verbs', 'Verbs', 'Common verbs and simple conjugations.', 'A1', 6)
on conflict (id) do update set
  name = excluded.name,
  title = excluded.title,
  description = excluded.description,
  cefr_level = excluded.cefr_level,
  display_order = excluded.display_order;

-- Media assets
insert into public.media (id, type, url, description) values
  (1, 'image', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Toilets_unisex.svg/960px-Toilets_unisex.svg.png', 'Unisex toilet sign icon (bathroom)'),
  (2, 'image', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Handshake_icon.svg/960px-Handshake_icon.svg.png', 'Handshake icon (meeting someone new)'),
  (3, 'audio', 'https://upload.wikimedia.org/wikipedia/commons/transcoded/4/4a/It-buongiorno.ogg/It-buongiorno.ogg.mp3', 'Audio pronunciation of \"Buongiorno\"')
on conflict (id) do update set
  type = excluded.type,
  url = excluded.url,
  description = excluded.description;

-- Questions (info + practice, teach-then-test)
insert into public.questions (id, lesson_id, media_id, type, prompt) values
  (1, 1, null, 'info', 'Ciao – Hello/Hi (informal greeting). Example: Maria saluta con \"Ciao!\" al suo amico.'),
  (2, 1, null, 'info', 'Buongiorno – Good morning / Hello (formal daytime greeting). Example: Dire \"Buongiorno\" al mattino.'),
  (3, 1, null, 'info', 'Buonasera – Good evening (greeting used in the afternoon/evening).'),
  (4, 1, null, 'info', 'Buonanotte – Good night (used when parting or going to sleep at night).'),
  (5, 1, null, 'info', 'Arrivederci – Goodbye (formal).'),
  (6, 1, null, 'info', 'Sì / No – Yes / No.'),
  (7, 1, null, 'info', 'Per favore – Please (used to politely request something).'),
  (8, 1, null, 'info', 'Grazie – Thank you. Example: \"Grazie per l''aiuto.\" (Thank you for the help.)'),
  (9, 1, null, 'info', 'Prego – You''re welcome (response to \"Grazie\").'),
  (10, 1, null, 'info', 'Mi scusi – Excuse me (to get attention or apologize, formal).'),
  (11, 1, null, 'info', 'Mi dispiace – I''m sorry (to apologize for a mistake).'),
  (12, 1, null, 'info', 'Come ti chiami? – What is your name? (informal).'),
  (13, 1, null, 'info', 'Mi chiamo ... – My name is ... Example: \"Mi chiamo Marco.\"'),
  (14, 1, null, 'info', 'Piacere (di conoscerti) – Nice to meet you.'),
  (15, 1, null, 'info', 'Come stai? – How are you? (informal).'),
  (16, 1, null, 'info', 'Sto bene, grazie. – I''m fine, thanks.'),
  (17, 1, null, 'multiple_choice', 'It''s 8:00 AM and you''re greeting your teacher. What do you say?'),
  (18, 1, null, 'multiple_choice', 'How do you ask someone''s name in Italian?'),
  (19, 1, null, 'fill_blank', 'Complete the dialogue: A: Come ti chiami? B: ________ (My name is Luca.)'),
  (20, 1, 2, 'multiple_choice', 'You meet someone new (see image). What Italian phrase do you say to greet them?'),
  (21, 1, null, 'multiple_choice', 'You receive a gift from a friend. What do you say?'),
  (22, 1, null, 'fill_blank', 'A: Grazie! B: ________.'),
  (23, 1, null, 'fill_blank', 'Complete the sentence: \"Sto ____, grazie.\" (I''m ____, thanks.)'),
  (24, 1, null, 'translate_en_to_it', 'Translate to Italian: \"Please.\"'),
  (25, 1, null, 'translate_it_to_en', 'Translate to English: \"Arrivederci.\"'),
  (26, 1, 3, 'listening', 'Listen to the audio and choose the phrase you hear.'),
  (27, 1, null, 'multiple_choice', 'You want to get a stranger''s attention politely. What do you say?'),
  (28, 1, null, 'multiple_choice', 'You accidentally step on someone''s foot. How do you apologize?'),
  (29, 2, null, 'info', 'Dov''è il bagno? – Where is the bathroom?'),
  (30, 2, null, 'info', 'Un biglietto, per favore. – One ticket, please.'),
  (31, 2, null, 'info', 'Quanto costa? – How much does it cost?'),
  (32, 2, null, 'info', 'Vorrei un caffè, per favore. – I would like a coffee, please.'),
  (33, 2, null, 'info', 'Parla inglese? – Do you speak English? (formal you)'),
  (34, 2, null, 'info', 'Non capisco. – I don''t understand.'),
  (35, 2, null, 'info', 'Il conto, per favore. – The bill, please.'),
  (36, 2, 1, 'multiple_choice', 'What Italian phrase would you use to ask for this place?'),
  (37, 2, null, 'translate_it_to_en', 'Translate to English: \"Un biglietto, per favore.\"'),
  (38, 2, null, 'fill_blank', 'Complete the request: \"Vorrei __ caffè, per favore.\"'),
  (39, 2, null, 'translate_en_to_it', 'Translate to Italian: \"Do you speak English?\"'),
  (40, 2, null, 'translate_it_to_en', 'Translate to English: \"Non capisco.\"'),
  (41, 2, null, 'multiple_choice', 'Which Italian phrase means \"How much does it cost?\"'),
  (42, 2, null, 'multiple_choice', 'At a restaurant, you are ready to pay. What do you say to ask for the bill?')
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  media_id = excluded.media_id,
  type = excluded.type,
  prompt = excluded.prompt;

-- Answers
insert into public.answers (id, question_id, answer_text, is_correct) values
  (1, 17, 'Buongiorno', true),
  (2, 17, 'Buonasera', false),
  (3, 17, 'Ciao', false),
  (4, 17, 'Arrivederci', false),
  (5, 18, 'Come ti chiami?', true),
  (6, 18, 'Come stai?', false),
  (7, 18, 'Mi chiamo Marco.', false),
  (8, 18, 'Quanti anni hai?', false),
  (9, 19, 'Mi chiamo Luca.', true),
  (10, 20, 'Piacere', true),
  (11, 20, 'Arrivederci', false),
  (12, 20, 'Buonasera', false),
  (13, 20, 'Come stai?', false),
  (14, 21, 'Grazie', true),
  (15, 21, 'Prego', false),
  (16, 21, 'Mi dispiace', false),
  (17, 21, 'Sì', false),
  (18, 22, 'Prego', true),
  (19, 23, 'bene', true),
  (20, 24, 'Per favore', true),
  (21, 25, 'Goodbye', true),
  (22, 26, 'Buongiorno', true),
  (23, 26, 'Buonasera', false),
  (24, 26, 'Arrivederci', false),
  (25, 26, 'Ciao', false),
  (26, 27, 'Mi scusi', true),
  (27, 27, 'Mi chiamo Mario', false),
  (28, 27, 'Per favore', false),
  (29, 27, 'Sto bene', false),
  (30, 28, 'Mi dispiace', true),
  (31, 28, 'Mi scusi', false),
  (32, 28, 'Grazie', false),
  (33, 28, 'Non capisco', false),
  (34, 36, 'Dov''è il bagno?', true),
  (35, 36, 'Quanto costa?', false),
  (36, 36, 'Il conto, per favore', false),
  (37, 36, 'Non capisco', false),
  (38, 37, 'One ticket, please', true),
  (39, 38, 'un', true),
  (40, 39, 'Parla inglese?', true),
  (41, 40, 'I don''t understand', true),
  (42, 41, 'Quanto costa?', true),
  (43, 41, 'Quanti anni hai?', false),
  (44, 41, 'Dov''è il bagno?', false),
  (45, 41, 'Come ti chiami?', false),
  (46, 42, 'Il conto, per favore', true),
  (47, 42, 'Dov''è il bagno?', false),
  (48, 42, 'Quanto costa?', false),
  (49, 42, 'Un biglietto, per favore', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer_text = excluded.answer_text,
  is_correct = excluded.is_correct;

-- Note: user_responses and user_progress seed data removed
-- These tables now require UUID user_ids from auth.users, which cannot be seeded
-- Real user data will be created through the application
