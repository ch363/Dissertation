# Pronunciation Checking

This document explains how pronunciation checking works in the Fluentia app end to end.

## Overview

Pronunciation is checked when the user does a **TEXT_TO_SPEECH** (pronunciation) task: they hear the target phrase, record themselves, then the app sends the recording to the backend. The backend uses **Azure Cognitive Services Speech (Pronunciation Assessment)** to score it and return correctness, score, and word-level feedback.

---

## 1. Mobile: When It’s “Pronunciation Mode”

In **SessionRunner** (`mobile/src/features/session/components/SessionRunner.tsx`), after the user taps “Check” you decide if this is a pronunciation check:

- The card is a **ListeningCard** in “speak” mode (`isListeningSpeakMode`).
- The user has provided an **audio URI** (they recorded something).

If both are true, you don’t validate a text answer; you validate the **recording** instead.

---

## 2. Mobile: Recording

Recording happens in **ListeningCard** (`mobile/src/features/session/components/cards/ListeningCard.tsx`):

- **Expo AV** `Audio.Recording.createAsync()` is used with:
  - **iOS**: `extension: '.wav'`, `LINEARPCM`, 16 kHz, mono, 16-bit.
  - **Android**: `extension: '.wav'`, default encoder, 16 kHz, mono.

So the app records **WAV** at 16 kHz mono, which matches what the backend (and Azure) expect.

---

## 3. Mobile: Sending the Recording to the Backend

When the user taps “Check” with a recording:

1. **SessionRunner** calls `SpeechRecognition.getAudioFile(audioUri)` (from `mobile/src/services/speech-recognition/index.ts`), which reads the file (via `expo-file-system` or `fetch`) and returns `{ uri, base64 }`.
2. It infers **audio format** from the URI (e.g. `.wav` → `'wav'`).
3. It calls **`validatePronunciation(questionId, audioFile.base64, audioFormat)`** in `mobile/src/services/api/progress.ts`, which sends a **POST** to:

   `POST /progress/questions/:questionId/pronunciation`  
   with body `{ audioBase64, audioFormat }`.

---

## 4. Backend: Progress → Pronunciation Service

**Progress controller** (`backend/src/progress/progress.controller.ts`) receives that POST and calls **ProgressService.validatePronunciation()** (`backend/src/progress/progress.service.ts`).

There the flow is:

1. Load the **question** and its **TEXT_TO_SPEECH variant** (and teaching text).
2. **Reference text** for scoring is either:
   - the variant’s `data.answer`, or  
   - the teaching’s **learning language string** (e.g. the Italian phrase).
3. **Reject** if `audioFormat !== 'wav'` (only WAV is supported).
4. Call **PronunciationService.assess()** with:
   - `audioBase64`
   - `referenceText`
   - `locale: 'it-IT'`

---

## 5. Backend: Azure Pronunciation Assessment

**PronunciationService** (`backend/src/speech/pronunciation/pronunciation.service.ts`) does the actual scoring:

1. **Config**: Uses `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` (and optional `AZURE_SPEECH_DEFAULT_LOCALE`).
2. **Audio handling**:
   - Decodes base64 to a buffer.
   - Uses **audio-format.util** to detect container (WAV, raw PCM, etc.).
   - For **WAV**: parses RIFF/WAVE PCM with `parseWavPcm()` and feeds PCM into the Azure SDK via a push stream (to avoid SDK WAV quirks).
   - For **raw PCM**: assumes 16 kHz, 16-bit mono and feeds it the same way.
   - Other formats are rejected (backend only accepts WAV at the progress API; the service itself supports WAV or raw PCM).
3. **Azure SDK**:
   - Creates a **SpeechRecognizer** with that audio and **PronunciationAssessmentConfig**:
     - **Reference text**: the expected phrase.
     - **Grading**: 0–100 (HundredMark).
     - **Granularity**: phoneme (so you get word and phoneme-level scores).
   - Runs **recognizeOnceAsync** to get one result.
4. **Result handling**:
   - If **NoMatch** → “No speech detected” (400).
   - If **Canceled** → maps auth/forbidden/bad-param to 503, else 400.
   - Otherwise reads the JSON result and **PronunciationAssessmentResult** to get:
     - **Overall scores**: accuracy, fluency, completeness, pronunciation (0–100).
     - **Words**: per-word accuracy and error type (e.g. Mispronunciation, Omission).
     - **Recognized text** (what Azure heard).

---

## 6. Backend: Response to the App

**ProgressService.validatePronunciation()** turns that into your API response:

- **overallScore**: `Math.round(assessment.scores.pronunciation)` (0–100).
- **transcription**: `assessment.recognizedText`.
- **words**: each word from the assessment with:
  - **score**: rounded word accuracy.
  - **feedback**: `'perfect'` if score ≥ 85, else `'could_improve'`.
- **isCorrect**: `overallScore >= 80`.

---

## 7. Mobile: Using the Result

Back in **SessionRunner**:

- **setPronunciationResult(pronunciationResponse)** so **ListeningCard** can show the pronunciation result UI (overall score, word list).
- **setUserAnswer(transcription)** so the “answer” is what was heard.
- **setIsCorrect(pronunciationResponse.isCorrect)** to drive correctness UI and haptics.
- You then **record the attempt** (e.g. `recordQuestionAttempt`) with score/percentage and update progress/XP as for other question types.

**ListeningCard** displays that in the “PRONUNCIATION RESULT” section (overall score and per-word scores/feedback).

---

## End-to-End Summary

| Step | Where | What happens |
|------|--------|----------------|
| 1 | **ListeningCard** | User records with Expo AV as **WAV**, 16 kHz mono. |
| 2 | **SessionRunner** | Detects pronunciation mode + audio URI, reads file to base64, infers `audioFormat` (e.g. `'wav'`). |
| 3 | **progress API** | `POST .../pronunciation` with `audioBase64` + `audioFormat`. |
| 4 | **ProgressService** | Loads question/variant, gets reference text, enforces `audioFormat === 'wav'`, calls **PronunciationService.assess()**. |
| 5 | **PronunciationService** | Decodes base64, parses WAV (or raw PCM), sends to **Azure Pronunciation Assessment** with reference text and locale. |
| 6 | **Azure** | Returns pronunciation/accuracy/fluency/completeness and per-word (and phoneme) analysis. |
| 7 | **ProgressService** | Maps to your DTO: overall score, transcription, words, `isCorrect = overallScore >= 80`. |
| 8 | **SessionRunner + ListeningCard** | Show result, store attempt, update progress. |

In short: **record WAV on device → send to your backend → backend calls Azure Pronunciation Assessment with the expected phrase → you use the returned score and transcription to decide correct/incorrect and show feedback.**
