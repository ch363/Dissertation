import { Injectable, NotFoundException } from '@nestjs/common';
import { Question, DELIVERY_METHOD } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaseCrudService } from '../common/services/base-crud.service';

@Injectable()
export class QuestionsService extends BaseCrudService<Question> {
  constructor(prisma: PrismaService) {
    super(prisma, 'question', 'Question');
  }

  async findAll(teachingId?: string) {
    const where = teachingId ? { teachingId } : {};
    return this.prisma.question.findMany({
      where,
      include: {
        teaching: {
          select: {
            id: true,
            userLanguageString: true,
            learningLanguageString: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        teaching: {
          select: {
            id: true,
            userLanguageString: true,
            learningLanguageString: true,
            lesson: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return question;
  }

  async updateDeliveryMethods(
    questionId: string,
    deliveryMethods: DELIVERY_METHOD[],
  ) {
    if (deliveryMethods.length === 0) {
      throw new NotFoundException('At least one delivery method is required');
    }

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    await Promise.all(
      deliveryMethods.map((deliveryMethod) =>
        this.prisma.questionVariant.upsert({
          where: {
            questionId_deliveryMethod: {
              questionId,
              deliveryMethod,
            },
          },
          update: {},
          create: {
            questionId,
            deliveryMethod,
            data: {},
          },
        }),
      ),
    );

    return this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        variants: true,
        teaching: {
          select: {
            id: true,
            userLanguageString: true,
            learningLanguageString: true,
          },
        },
      },
    });
  }
}
