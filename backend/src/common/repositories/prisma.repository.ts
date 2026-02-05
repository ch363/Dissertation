import { PrismaService } from '../../prisma/prisma.service';
import {
  ITransactionalRepository,
  FindOptions,
  WhereClause,
  TransactionClient,
} from './repository.interface';
import { LoggerService } from '../logger';

/**
 * PrismaRepository
 * 
 * Base class for Prisma-based repositories.
 * Implements ITransactionalRepository using Prisma.
 * 
 * Demonstrates:
 * - Dependency Inversion: Implements abstract IRepository interface
 * - Template Method Pattern: Provides common CRUD operations
 * - Open/Closed: Open for extension via subclasses, closed for modification
 * 
 * Usage:
 * ```
 * class UserRepository extends PrismaRepository<User, CreateUserDto, UpdateUserDto> {
 *   constructor(prisma: PrismaService) {
 *     super(prisma, 'user');
 *   }
 *   // Add custom methods here
 * }
 * ```
 */
export abstract class PrismaRepository<
  T,
  CreateDto = Partial<T>,
  UpdateDto = Partial<T>,
> implements ITransactionalRepository<T, CreateDto, UpdateDto>
{
  protected readonly logger: LoggerService;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: string,
  ) {
    this.logger = new LoggerService(`${modelName}Repository`);
  }

  /**
   * Get the Prisma model delegate.
   */
  protected getModel() {
    return (this.prisma as any)[this.modelName];
  }

  async findById(id: string): Promise<T | null> {
    try {
      return await this.getModel().findUnique({
        where: { id },
      });
    } catch (error) {
      this.logger.logError(`Failed to find ${this.modelName} by ID`, error, {
        id,
      });
      throw error;
    }
  }

  async findOne(where: WhereClause): Promise<T | null> {
    try {
      return await this.getModel().findFirst({
        where,
      });
    } catch (error) {
      this.logger.logError(`Failed to find ${this.modelName}`, error, {
        where,
      });
      throw error;
    }
  }

  async findAll(options?: FindOptions<T>): Promise<T[]> {
    try {
      return await this.getModel().findMany(options || {});
    } catch (error) {
      this.logger.logError(`Failed to find all ${this.modelName}`, error, {
        options,
      });
      throw error;
    }
  }

  async create(data: CreateDto): Promise<T> {
    try {
      return await this.getModel().create({
        data,
      });
    } catch (error) {
      this.logger.logError(`Failed to create ${this.modelName}`, error, {
        data,
      });
      throw error;
    }
  }

  async update(id: string, data: UpdateDto): Promise<T> {
    try {
      return await this.getModel().update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.logError(`Failed to update ${this.modelName}`, error, {
        id,
        data,
      });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.getModel().delete({
        where: { id },
      });
    } catch (error) {
      this.logger.logError(`Failed to delete ${this.modelName}`, error, {
        id,
      });
      throw error;
    }
  }

  async count(where?: WhereClause): Promise<number> {
    try {
      return await this.getModel().count({
        where: where || {},
      });
    } catch (error) {
      this.logger.logError(`Failed to count ${this.modelName}`, error, {
        where,
      });
      throw error;
    }
  }

  async exists(where: WhereClause): Promise<boolean> {
    try {
      const count = await this.getModel().count({
        where,
        take: 1,
      });
      return count > 0;
    } catch (error) {
      this.logger.logError(
        `Failed to check existence of ${this.modelName}`,
        error,
        { where },
      );
      throw error;
    }
  }

  async transaction<R>(
    fn: (tx: TransactionClient) => Promise<R>,
  ): Promise<R> {
    try {
      return await this.prisma.$transaction(fn);
    } catch (error) {
      this.logger.logError('Transaction failed', error);
      throw error;
    }
  }

  /**
   * Execute raw Prisma queries (escape hatch for complex queries).
   * Subclasses can use this for advanced queries not covered by the interface.
   */
  protected async executeRaw(query: string, ...params: any[]): Promise<any> {
    try {
      return await this.prisma.$queryRawUnsafe(query, ...params);
    } catch (error) {
      this.logger.logError('Raw query failed', error, { query });
      throw error;
    }
  }
}
