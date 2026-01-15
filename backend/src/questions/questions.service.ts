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
    // With new schema, each question has a single type
    // This method now updates the question's type to the first delivery method
    // If multiple methods are provided, we could create multiple questions, but for now we'll just update the type
    
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

    // Update the question type to the first delivery method
    // Note: With the new schema, if you need multiple delivery methods for the same teaching,
    // you should create multiple questions (one per delivery method)
    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        type: deliveryMethods[0],
      },
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
}
