import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { DELIVERY_METHOD } from '@prisma/client';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

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

  async create(createDto: CreateQuestionDto) {
    // Authorization: Admin access required. Authorization is enforced at the Controller level via @UseGuards(SupabaseJwtGuard).
    // TODO: Implement admin role check in Controller guard (see questions.controller.ts)
    return this.prisma.question.create({
      data: createDto,
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

  async remove(id: string) {
    // Authorization: Admin access required. Authorization is enforced at the Controller level via @UseGuards(SupabaseJwtGuard).
    // TODO: Implement admin role check in Controller guard (see questions.controller.ts)
    // Cascade delete is handled by Prisma schema
    try {
      return await this.prisma.question.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
  }

  async updateDeliveryMethods(questionId: string, deliveryMethods: DELIVERY_METHOD[]) {
    // Authorization: Admin access required. Authorization is enforced at the Controller level via @UseGuards(SupabaseJwtGuard).
    // TODO: Implement admin role check in Controller guard (see questions.controller.ts)
    // With variants schema, this method ensures the specified variants exist.
    // (Payload is managed by the content importer; admin tooling can be added later.)
    if (deliveryMethods.length === 0) {
      throw new NotFoundException('At least one delivery method is required');
    }

    // Verify question exists
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    // Upsert variants with empty payload (data = {}) for now.
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
