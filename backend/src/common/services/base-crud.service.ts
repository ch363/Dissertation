import { NotFoundException } from '@nestjs/common';
import { IRepository, WhereClause, FindOptions } from '../repositories/repository.interface';
import { LoggerService } from '../logger';

/**
 * BaseCrudService
 *
 * Abstract base class for services with standard CRUD operations.
 * Eliminates duplicate CRUD code across services (DRY principle).
 *
 * Usage:
 * ```typescript
 * @Injectable()
 * export class UsersService extends BaseCrudService<User, CreateUserDto, UpdateUserDto> {
 *   constructor(private readonly userRepository: UserRepository) {
 *     super(userRepository, 'User');
 *   }
 *
 *   // Add custom methods here
 *   async findByEmail(email: string): Promise<User | null> {
 *     return this.repository.findOne({ email });
 *   }
 * }
 * ```
 *
 * Benefits:
 * - DRY: Common CRUD logic defined once
 * - Consistency: Standard error handling and logging
 * - Type Safety: Generic types ensure correct DTOs
 * - Extensibility: Easy to override methods for custom behavior
 */
export abstract class BaseCrudService<
  T,
  CreateDto = Partial<T>,
  UpdateDto = Partial<T>,
> {
  protected readonly logger: LoggerService;

  constructor(
    protected readonly repository: IRepository<T, CreateDto, UpdateDto>,
    protected readonly entityName: string,
  ) {
    this.logger = new LoggerService(`${entityName}Service`);
  }

  /**
   * Find all entities matching criteria.
   */
  async findAll(options?: FindOptions<T>): Promise<T[]> {
    return this.repository.findAll(options);
  }

  /**
   * Find a single entity by ID.
   * Throws NotFoundException if not found.
   */
  async findOne(id: string): Promise<T> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`${this.entityName} with ID ${id} not found`);
    }
    return entity;
  }

  /**
   * Find a single entity by ID.
   * Returns null if not found (no exception).
   */
  async findById(id: string): Promise<T | null> {
    return this.repository.findById(id);
  }

  /**
   * Find a single entity matching criteria.
   */
  async findWhere(where: WhereClause): Promise<T | null> {
    return this.repository.findOne(where);
  }

  /**
   * Create a new entity.
   */
  async create(data: CreateDto): Promise<T> {
    return this.repository.create(data);
  }

  /**
   * Update an entity by ID.
   * Does not verify existence first (Prisma throws if not found).
   */
  async update(id: string, data: UpdateDto): Promise<T> {
    return this.repository.update(id, data);
  }

  /**
   * Delete an entity by ID.
   */
  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Count entities matching criteria.
   */
  async count(where?: WhereClause): Promise<number> {
    return this.repository.count(where);
  }

  /**
   * Check if an entity exists.
   */
  async exists(where: WhereClause): Promise<boolean> {
    return this.repository.exists(where);
  }
}
