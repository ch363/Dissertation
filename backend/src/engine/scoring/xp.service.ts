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

  async award(userId: string, event: XpEvent): Promise<number> {
    const xpAmount = this.calculateXp(event);

    await this.prisma.xpEvent.create({
      data: {
        userId,
        amount: xpAmount,
        reason: this.getReason(event),
        occurredAt: new Date(),
      },
    });

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

    const dailyMap = new Map<string, { totalXp: number; eventCount: number }>();

    for (const event of events) {
      const dateKey = event.occurredAt.toISOString().split('T')[0];

      const existing = dailyMap.get(dateKey) || { totalXp: 0, eventCount: 0 };
      existing.totalXp += event.amount;
      existing.eventCount += 1;
      dailyMap.set(dateKey, existing);
    }

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

  private calculateXp(event: XpEvent): number {
    if (event.type === 'attempt') {
      let xp = 5;

      if (event.correct) {
        xp += 10;

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
