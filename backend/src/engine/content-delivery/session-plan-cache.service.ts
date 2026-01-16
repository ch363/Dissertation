import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionPlanDto } from './session-types';

interface CacheEntry {
  plan: SessionPlanDto;
  timestamp: number;
}

/**
 * Session Plan Cache Service
 * 
 * Provides in-memory caching for session plans to reduce expensive database queries.
 * Cache entries are keyed by userId, mode, lessonId, and timeBudgetSec.
 * 
 * Cache invalidation:
 * - Automatic TTL expiry (default: 5 minutes)
 * - Manual invalidation when user progress changes
 */
@Injectable()
export class SessionPlanCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly ttlMs: number;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    // Get TTL from config, default to 5 minutes (300000 ms)
    this.ttlMs =
      this.configService.get<number>('sessionPlanCache.ttlMs') || 300000;
  }

  /**
   * Generate cache key from session context
   */
  generateKey(userId: string, mode: string, lessonId?: string, timeBudgetSec?: number): string {
    const lessonPart = lessonId || 'all';
    const timeBudgetPart = timeBudgetSec?.toString() || 'default';
    return `${userId}:${mode}:${lessonPart}:${timeBudgetPart}`;
  }

  /**
   * Get cached session plan if valid
   * @returns Cached plan if valid, null if cache miss or expired
   */
  get(key: string): SessionPlanDto | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if entry has expired
    if (age >= this.ttlMs) {
      // Remove expired entry
      this.cache.delete(key);
      return null;
    }

    return entry.plan;
  }

  /**
   * Store session plan in cache
   */
  set(key: string, plan: SessionPlanDto): void {
    this.cache.set(key, {
      plan,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate all cache entries for a user
   * Called when user progress changes (question attempts, teaching completions)
   */
  invalidate(userId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Invalidate cache entries for a specific user and lesson
   * More granular invalidation for lesson-specific plans
   */
  invalidateLesson(userId: string, lessonId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`) && key.includes(`:${lessonId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear entire cache (useful for testing/debugging)
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics (useful for monitoring)
   */
  getStats(): { size: number; ttlMs: number } {
    return {
      size: this.cache.size,
      ttlMs: this.ttlMs,
    };
  }
}
