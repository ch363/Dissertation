import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionPlanDto } from './session-types';

interface CacheEntry {
  plan: SessionPlanDto;
  timestamp: number;
}

@Injectable()
export class SessionPlanCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly ttlMs: number;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    this.ttlMs =
      this.configService.get<number>('sessionPlanCache.ttlMs') || 300000;
  }

  generateKey(
    userId: string,
    mode: string,
    lessonId?: string,
    moduleId?: string,
    timeBudgetSec?: number,
  ): string {
    const lessonPart = lessonId || 'all';
    const modulePart = moduleId || 'all';
    const timeBudgetPart = timeBudgetSec?.toString() || 'default';
    return `${userId}:${mode}:${lessonPart}:${modulePart}:${timeBudgetPart}`;
  }

  get(key: string): SessionPlanDto | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age >= this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.plan;
  }

  set(key: string, plan: SessionPlanDto): void {
    this.cache.set(key, {
      plan,
      timestamp: Date.now(),
    });
  }

  invalidate(userId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  invalidateLesson(userId: string, lessonId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`) && key.includes(`:${lessonId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; ttlMs: number } {
    return {
      size: this.cache.size,
      ttlMs: this.ttlMs,
    };
  }
}
