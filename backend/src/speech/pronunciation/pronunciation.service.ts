import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import {
  PronunciationAssessmentResult,
  PronunciationErrorType,
  PronunciationWordScore,
} from './types';
import {
  detectAudioContainer,
  looksLikeRawPcm16le,
  parseWavPcm,
} from './audio-format.util';

type AssessInput = {
  audioBase64: string;
  referenceText: string;
  locale?: string;
};

function clampHundred(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function toScore(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(clampHundred(num) * 100) / 100; // 2dp
}

function asErrorType(value: unknown): PronunciationErrorType | undefined {
  if (typeof value !== 'string') return undefined;
  const allowed: PronunciationErrorType[] = [
    'None',
    'Omission',
    'Insertion',
    'Mispronunciation',
    'UnexpectedBreak',
    'MissingBreak',
  ];
  return (allowed as string[]).includes(value)
    ? (value as PronunciationErrorType)
    : undefined;
}

function safeJsonParse(input: string): any | null {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

@Injectable()
export class PronunciationService {
  private readonly logger = new Logger(PronunciationService.name);

  constructor(private readonly configService: ConfigService) {}

  async assess(input: AssessInput): Promise<PronunciationAssessmentResult> {
    const speechConfigObj = this.configService.get('speech');

    const azureKey = speechConfigObj?.azureKey ?? process.env.AZURE_SPEECH_KEY;
    const azureRegion =
      speechConfigObj?.azureRegion ?? process.env.AZURE_SPEECH_REGION;
    const defaultLocale =
      speechConfigObj?.defaultLocale ?? process.env.AZURE_SPEECH_DEFAULT_LOCALE;

    if (!azureKey || !azureRegion) {
      // Should be prevented by env validation, but keep a safe runtime check.
      throw new ServiceUnavailableException('Speech service is not configured');
    }

    const locale = input.locale?.trim() || defaultLocale?.trim() || 'it-IT';
    const referenceText = (input.referenceText ?? '').trim();
    if (!referenceText) {
      throw new BadRequestException('Reference text is required');
    }

    const audioBytes = Buffer.from(input.audioBase64, 'base64');
    if (!audioBytes || audioBytes.length === 0) {
      throw new BadRequestException('Audio payload is empty or invalid base64');
    }

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      azureKey,
      azureRegion,
    );
    speechConfig.speechRecognitionLanguage = locale;

    const audioContainer = detectAudioContainer(audioBytes);
    const audioConfig = this.createAudioConfigFromBytes(audioBytes, audioContainer);
    const recognizer = new SpeechSDK.SpeechRecognizer(
      speechConfig,
      audioConfig,
    );

    // Pronunciation Assessment configuration
    const paConfig = new SpeechSDK.PronunciationAssessmentConfig(
      referenceText,
      SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
      SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
      true, // enable miscue
    );
    paConfig.applyTo(recognizer);

    try {
      const result = await new Promise<SpeechSDK.SpeechRecognitionResult>(
        (resolve, reject) => {
          recognizer.recognizeOnceAsync(
            (r) => resolve(r),
            (e) => reject(e),
          );
        },
      );

      if (result.reason === SpeechSDK.ResultReason.NoMatch) {
        throw new BadRequestException('No speech detected in audio');
      }

      if (result.reason === SpeechSDK.ResultReason.Canceled) {
        const details = SpeechSDK.CancellationDetails.fromResult(result);
        this.logger.error(
          `Speech canceled: reason=${details.reason} code=${details.ErrorCode} details=${details.errorDetails}`,
        );

        // Treat auth/config as 503, everything else as 400.
        if (
          details.ErrorCode ===
            SpeechSDK.CancellationErrorCode.AuthenticationFailure ||
          details.ErrorCode === SpeechSDK.CancellationErrorCode.Forbidden ||
          details.ErrorCode ===
            SpeechSDK.CancellationErrorCode.BadRequestParameters
        ) {
          throw new ServiceUnavailableException(
            'Speech service request failed',
          );
        }

        throw new BadRequestException(
          `Speech recognition canceled: ${details.errorDetails || 'Unknown error'}`,
        );
      }

      const json = result.properties.getProperty(
        SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult,
      );
      const parsed = json ? safeJsonParse(json) : null;

      const paResult =
        SpeechSDK.PronunciationAssessmentResult.fromResult(result);

      const nBest0 = parsed?.NBest?.[0] ?? null;
      const overall = nBest0?.PronunciationAssessment ?? null;

      const recognizedText =
        (typeof nBest0?.Display === 'string' && nBest0.Display) ||
        (typeof nBest0?.DisplayText === 'string' && nBest0.DisplayText) ||
        (typeof result.text === 'string' && result.text) ||
        undefined;

      const scores = {
        accuracy: toScore(overall?.AccuracyScore ?? paResult.accuracyScore),
        fluency: toScore(overall?.FluencyScore ?? paResult.fluencyScore),
        completeness: toScore(
          overall?.CompletenessScore ?? paResult.completenessScore,
        ),
        pronunciation: toScore(
          overall?.PronScore ?? paResult.pronunciationScore,
        ),
      };

      const words: PronunciationWordScore[] = this.extractWordsFromJson(nBest0);

      return {
        locale,
        referenceText,
        scores,
        words,
        recognizedText,
      };
    } catch (err) {
      // If the SDK fails parsing WAV input, surface as 400 with actionable guidance.
      const message =
        err && typeof err === 'object' && 'message' in (err as any)
          ? String((err as any).message)
          : '';
      if (message.toLowerCase().includes('wav') && message.toLowerCase().includes('header')) {
        throw new BadRequestException(
          'Invalid audio payload: expected WAV (RIFF/WAVE) or raw 16kHz mono PCM. Please re-record and try again.',
        );
      }
      if (
        err instanceof BadRequestException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      this.logger.error('Pronunciation assessment failed', err);
      throw new ServiceUnavailableException('Pronunciation assessment failed');
    } finally {
      recognizer.close();
      // AudioConfig doesn't expose close; GC will handle stream lifecycle.
    }
  }

  private createAudioConfigFromBytes(
    audioBytes: Buffer,
    container: ReturnType<typeof detectAudioContainer>,
  ): SpeechSDK.AudioConfig {
    // Prefer WAV input when present; otherwise fall back to raw PCM stream.
    if (container === 'wav') {
      // The Speech SDK's WAV parser is brittle with some chunk layouts.
      // We parse WAV ourselves (tolerates chunk re-ordering) and stream raw PCM.
      try {
        const parsed = parseWavPcm(audioBytes);
        const streamFormat = SpeechSDK.AudioStreamFormat.getWaveFormatPCM(
          parsed.sampleRateHz,
          parsed.bitsPerSample,
          parsed.channels,
        );
        const pushStream = SpeechSDK.AudioInputStream.createPushStream(
          streamFormat,
        );
        const arrayBuffer = Uint8Array.from(parsed.pcmData).buffer;
        pushStream.write(arrayBuffer);
        pushStream.close();
        return SpeechSDK.AudioConfig.fromStreamInput(pushStream);
      } catch (wavParseErr) {
        throw new BadRequestException(
          `Invalid WAV payload: ${(wavParseErr as any)?.message ?? 'could not parse WAV'}`,
        );
      }
    }

    if (!looksLikeRawPcm16le(audioBytes)) {
      // Known container but not WAV: we don't transcode server-side (no ffmpeg dependency).
      throw new BadRequestException(
        `Unsupported audio container "${container}" for pronunciation assessment. Please send WAV (RIFF/WAVE PCM) audio.`,
      );
    }

    // Raw PCM fallback: assume 16kHz, 16-bit, mono, little-endian.
    const sampleRateHz = 16000;
    const bitsPerSample = 16;
    const channels = 1;

    const bytesPerSecond = sampleRateHz * channels * (bitsPerSample / 8);
    const durationSec = audioBytes.length / bytesPerSecond;
    if (!Number.isFinite(durationSec) || durationSec <= 0) {
      throw new BadRequestException('Audio payload is empty or invalid');
    }
    if (durationSec > 35) {
      throw new BadRequestException(
        'Audio is too long for pronunciation assessment (please keep it under ~30s)',
      );
    }

    const streamFormat = SpeechSDK.AudioStreamFormat.getWaveFormatPCM(
      sampleRateHz,
      bitsPerSample,
      channels,
    );
    const pushStream = SpeechSDK.AudioInputStream.createPushStream(streamFormat);
    // Ensure we pass a plain ArrayBuffer (not SharedArrayBuffer).
    const arrayBuffer = Uint8Array.from(audioBytes).buffer;
    pushStream.write(arrayBuffer);
    pushStream.close();
    return SpeechSDK.AudioConfig.fromStreamInput(pushStream);
  }

  private extractWordsFromJson(nBest0: any | null): PronunciationWordScore[] {
    const wordsRaw: any[] = Array.isArray(nBest0?.Words) ? nBest0.Words : [];
    if (wordsRaw.length === 0) return [];

    return wordsRaw
      .map((w) => {
        const word = typeof w?.Word === 'string' ? w.Word : '';
        if (!word) return null;

        const pa = w?.PronunciationAssessment ?? w;

        const phonemesRaw: any[] = Array.isArray(w?.Phonemes) ? w.Phonemes : [];
        const phonemes =
          phonemesRaw.length > 0
            ? phonemesRaw
                .map((p) => {
                  const phoneme =
                    typeof p?.Phoneme === 'string' ? p.Phoneme : '';
                  if (!phoneme) return null;
                  return {
                    phoneme,
                    accuracy: toScore(p?.AccuracyScore),
                  };
                })
                .filter(Boolean)
            : undefined;

        const wordScore: PronunciationWordScore = {
          word,
          accuracy: toScore(pa?.AccuracyScore),
          errorType: asErrorType(pa?.ErrorType),
          phonemes:
            phonemes && phonemes.length > 0 ? (phonemes as any) : undefined,
        };

        return wordScore;
      })
      .filter(Boolean) as PronunciationWordScore[];
  }
}
