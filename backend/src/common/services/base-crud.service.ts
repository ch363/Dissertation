// Base class for CRUD operations on Prisma models
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggerService } from '../logger';

@Injectable()
export abstract class BaseCrudService<T> {
  protected readonly logger: LoggerService;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: string,
    protected readonly displayName: string,
  ) {
    this.logger = new LoggerService(`${displayName}Service`);
  }

  protected get model(): any {
    return (this.prisma as any)[this.modelName];
  }

  async create(data: any): Promise<T> {
    try {
      return await this.model.create({ data });
    } catch (error) {
      this.logger.logError(`Failed to create ${this.displayName}`, {
        data,
        error,
      });
      throw error;
    }
  }

  async findAll(options?: any): Promise<T[]> {
    try {
      return await this.model.findMany(options);
    } catch (error) {
      this.logger.logError(`Failed to find all ${this.displayName}s`, {
        error,
      });
      throw error;
    }
  }

  async findOne(id: string, options?: any): Promise<T> {
    try {
      const record = await this.model.findUnique({
        where: { id },
        ...options,
      });

      if (!record) {
        throw new NotFoundException(
          `${this.displayName} with ID ${id} not found`,
        );
      }

      return record;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.logError(`Failed to find ${this.displayName}`, { id, error });
      throw error;
    }
  }

  async update(id: string, data: any): Promise<T> {
    try {
      return await this.model.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `${this.displayName} with ID ${id} not found`,
        );
      }
      this.logger.logError(`Failed to update ${this.displayName}`, {
        id,
        data,
        error,
      });
      throw error;
    }
  }

  async remove(id: string): Promise<T> {
    try {
      return await this.model.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `${this.displayName} with ID ${id} not found`,
        );
      }
      this.logger.logError(`Failed to remove ${this.displayName}`, {
        id,
        error,
      });
      throw error;
    }
  }

  async count(where?: any): Promise<number> {
    try {
      return await this.model.count({ where });
    } catch (error) {
      this.logger.logError(`Failed to count ${this.displayName}s`, {
        where,
        error,
      });
      throw error;
    }
  }
}
