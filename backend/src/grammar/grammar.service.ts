import { Injectable, Logger } from '@nestjs/common';

const LANGUAGETOOL_API = 'https://api.languagetool.org/v2/check';
const REQUEST_TIMEOUT_MS = 5000;
/** Penalty per issue (grammar/spelling) – cap total deduction at 100. */
const PENALTY_PER_MATCH = 15;
const MAX_PENALTY = 100;

export interface GrammarCheckResult {
  /** 0–100 grammatical correctness score. */
  score: number;
  /** Number of issues found. */
  issueCount: number;
}

@Injectable()
export class GrammarService {
  private readonly logger = new Logger(GrammarService.name);

  /**
   * Check grammatical correctness of text in the given language.
   * Returns a 0–100 score (100 = no issues). On network/API errors returns null.
   */
  async checkGrammar(
    text: string,
    languageCode: string,
  ): Promise<GrammarCheckResult | null> {
    const trimmed = text?.trim();
    if (!trimmed || trimmed.length > 20000) {
      return { score: 100, issueCount: 0 };
    }

    try {
      const params = new URLSearchParams();
      params.set('text', trimmed);
      params.set('language', languageCode);

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      const res = await fetch(LANGUAGETOOL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        this.logger.warn(
          `LanguageTool API non-OK: ${res.status} language=${languageCode}`,
        );
        return null;
      }

      const data = (await res.json()) as {
        matches?: Array<{ rule?: { category?: { id?: string } } }>;
      };
      const matches = Array.isArray(data.matches) ? data.matches : [];
      const penalty = Math.min(MAX_PENALTY, matches.length * PENALTY_PER_MATCH);
      const score = Math.max(0, 100 - penalty);

      return { score, issueCount: matches.length };
    } catch (error) {
      this.logger.warn(
        `Grammar check failed: ${(error as Error).message} language=${languageCode} len=${trimmed.length}`,
      );
      return null;
    }
  }
}
