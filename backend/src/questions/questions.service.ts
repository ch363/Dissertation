import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Question, DELIVERY_METHOD } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaseCrudService } from '../common/services/base-crud.service';
import {
  teachingIncludeWithStrings,
  teachingIncludeWithLesson,
} from '../common/prisma/selects';

@Injectable()
export class QuestionsService extends BaseCrudService<Question> {
  constructor(prisma: PrismaService) {
    super(prisma, 'question', 'Question');
  }

  async findAll(teachingId?: string) {
    const where = teachingId ? { teachingId } : {};
    return this.prisma.question.findMany({
      where,
      include: teachingIncludeWithStrings,
    });
  }

  async findOne(id: string) {
    return super.findOne(id, {
      include: teachingIncludeWithLesson,
    });
  }

  async updateDeliveryMethods(
    questionId: string,
    deliveryMethods: DELIVERY_METHOD[],
  ) {
    if (deliveryMethods.length === 0) {
      throw new BadRequestException('At least one delivery method is required');
    }

    // Verify question exists
    await this.findOrThrow(questionId);

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
        ...teachingIncludeWithStrings,
      },
    });
  }
}
