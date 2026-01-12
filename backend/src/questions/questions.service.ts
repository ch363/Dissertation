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
        questionDeliveryMethods: true,
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
        questionDeliveryMethods: true,
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return question;
  }

  async create(createDto: CreateQuestionDto) {
    // TODO: Add admin check
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
        questionDeliveryMethods: true,
      },
    });
  }

  async remove(id: string) {
    // TODO: Add admin check
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
    // TODO: Add admin check
    // Verify question exists
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    // Replace delivery methods atomically in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Delete existing join rows
      await tx.questionDeliveryMethod.deleteMany({
        where: { questionId },
      });

      // Insert new join rows
      if (deliveryMethods.length > 0) {
        await tx.questionDeliveryMethod.createMany({
          data: deliveryMethods.map((method) => ({
            questionId,
            deliveryMethod: method,
          })),
        });
      }

      // Return updated question with delivery methods
      return tx.question.findUnique({
        where: { id: questionId },
        include: {
          questionDeliveryMethods: true,
        },
      });
    });
  }
}
