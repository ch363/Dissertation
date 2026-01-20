/**
 * XP (Experience Points) Service
 *
 * This service manages XP awards and tracking. XP is stored as events over time,
 * allowing for historical analysis and daily summaries.
 *
 * This is a SERVICE LAYER, not middleware. It's called by ProgressService
 * after recording an attempt. It does NOT handle HTTP requests directly.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface XpEvent {
  type: 'attempt';
  correct: boolean;
  timeMs: number;
}

export interface XpSummary {
  date: Date;
  totalXp: number;
  eventCount: number;
}

@Injectable()
export class XpService {
  constructor(private prisma: PrismaService) {}

  /**
   * Award XP for an event and return the amount awarded.
   *
   * @param userId User ID
   * @param event Event that triggered XP
   * @returns Amount of XP awarded
   */
  async award(userId: string, event: XpEvent): Promise<number> {
    const xpAmount = this.calculateXp(event);

    // Record XP event
    await this.prisma.xpEvent.create({
      data: {
        userId,
        amount: xpAmount,
        reason: this.getReason(event),
        occurredAt: new Date(),
      },
    });

    // Update user's total knowledge points
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        knowledgePoints: {
          increment: xpAmount,
        },
      },
    });

    return xpAmount;
  }

  /**
   * Get XP summary for a date range.
   *
   * @param userId User ID
   * @param rangeDays Number of days to look back (default: 30)
   * @returns Daily XP totals
   */
  async getXpSummary(
    userId: string,
    rangeDays: number = 30,
  ): Promise<XpSummary[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - rangeDays);

    const events = await this.prisma.xpEvent.findMany({
      where: {
        userId,
        occurredAt: {
          gte: startDate,
        },
      },
      orderBy: {
        occurredAt: 'asc',
      },
    });

    // Group by date
    const dailyMap = new Map<string, { totalXp: number; eventCount: number }>();

    for (const event of events) {
      const dateKey = event.occurredAt.toISOString().split('T')[0]; // YYYY-MM-DD

      const existing = dailyMap.get(dateKey) || { totalXp: 0, eventCount: 0 };
      existing.totalXp += event.amount;
      existing.eventCount += 1;
      dailyMap.set(dateKey, existing);
    }

    // Convert to array
    const summaries: XpSummary[] = [];
    for (const [dateKey, data] of dailyMap.entries()) {
      summaries.push({
        date: new Date(dateKey),
        totalXp: data.totalXp,
        eventCount: data.eventCount,
      });
    }

    return summaries.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Calculate XP amount for an event.
   */
  private calculateXp(event: XpEvent): number {
    if (event.type === 'attempt') {
      // Base XP for attempting
      let xp = 5;

      // Bonus for correct answer
      if (event.correct) {
        xp += 10;

        // Speed bonus (faster = more XP, up to +5)
        if (event.timeMs < 5000) {
          xp += 5;
        } else if (event.timeMs < 10000) {
          xp += 3;
        } else if (event.timeMs < 20000) {
          xp += 1;
        }
      }

      return xp;
    }

    return 0;
  }

  /**
   * Get reason string for XP event.
   */
  private getReason(event: XpEvent): string {
    if (event.type === 'attempt') {
      if (event.correct) {
        return `Correct answer${event.timeMs < 5000 ? ' (fast)' : ''}`;
      }
      return 'Attempted question';
    }
    return 'Unknown event';
  }
}
