/**
 * Base class for CRUD operations on Prisma models
 *
 * Provides common create, read, update, delete operations with
 * consistent error handling and logging.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggerService } from '../logger';
import { isPrismaError } from '../utils/error.util';

/**
 * Prisma delegate interface for dynamic model access
 * This represents the common methods available on Prisma model delegates
 */
interface PrismaDelegate {
  create(args: { data: any }): Promise<unknown>;

  findMany(args?: any): Promise<unknown[]>;

  findUnique(args: {
    where: { id: string };
    [key: string]: any;
  }): Promise<unknown | null>;

  update(args: { where: { id: string }; data: any }): Promise<unknown>;
  delete(args: { where: { id: string } }): Promise<unknown>;

  count(args?: { where?: any }): Promise<number>;
}

/**
 * Options for find operations
 */
export interface FindOptions {
  include?: any;

  select?: any;
}

/**
 * Options for findAll operations
 */
export interface FindAllOptions extends FindOptions {
  where?: any;

  orderBy?: any;
  take?: number;
  skip?: number;
}

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

  /**
   * Gets the Prisma delegate for the model
   * Uses type assertion due to dynamic model access
   */
  protected get model(): PrismaDelegate {
    return (this.prisma as unknown as Record<string, PrismaDelegate>)[
      this.modelName
    ];
  }

  async create(data: any): Promise<T> {
    try {
      return (await this.model.create({ data })) as T;
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
      return (await this.model.findMany(options)) as T[];
    } catch (error) {
      this.logger.logError(`Failed to find all ${this.displayName}s`, {
        error,
      });
      throw error;
    }
  }

  async findOne(id: string, options?: FindOptions): Promise<T> {
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

      return record as T;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.logError(`Failed to find ${this.displayName}`, { id, error });
      throw error;
    }
  }

  /**
   * Find a record by ID or throw NotFoundException
   * Simplified version for internal use when you just need to verify existence
   */
  protected async findOrThrow(
    id: string,
    include?: Record<string, unknown>,
  ): Promise<T> {
    const record = await (this.model as any).findUnique({
      where: { id },
      ...(include && { include }),
    });

    if (!record) {
      throw new NotFoundException(
        `${this.displayName} with ID ${id} not found`,
      );
    }

    return record as T;
  }

  async update(id: string, data: any): Promise<T> {
    try {
      return (await this.model.update({
        where: { id },
        data,
      })) as T;
    } catch (error: unknown) {
      if (isPrismaError(error) && error.code === 'P2025') {
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
      return (await this.model.delete({
        where: { id },
      })) as T;
    } catch (error: unknown) {
      if (isPrismaError(error) && error.code === 'P2025') {
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
