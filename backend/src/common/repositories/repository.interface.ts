import { Prisma } from '@prisma/client';

/**
 * Repository Interfaces
 *
 * Demonstrates Interface Segregation Principle (ISP):
 * - IReadRepository: For consumers that only need read operations
 * - IWriteRepository: For consumers that only need write operations
 * - IRepository: Combined interface for full CRUD (backward compatible)
 *
 * Benefits:
 * - Testability: Easy to mock for unit tests
 * - Flexibility: Can swap implementations (e.g., in-memory, different ORMs)
 * - Separation of Concerns: Data access logic isolated from business logic
 * - ISP Compliance: Consumers only depend on operations they use
 */

export interface FindOptions<T = any> {
  where?: any;
  orderBy?: any;
  take?: number;
  skip?: number;
  include?: any;
  select?: any;
}

export interface WhereClause {
  [key: string]: any;
}

/**
 * IReadRepository - Read-only operations
 *
 * Use this interface when a service only needs to read data.
 * Supports dependency inversion without exposing write capabilities.
 */
export interface IReadRepository<T> {
  /**
   * Find a single entity by ID.
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find a single entity by arbitrary where clause.
   */
  findOne(where: WhereClause): Promise<T | null>;

  /**
   * Find all entities matching criteria.
   */
  findAll(options?: FindOptions<T>): Promise<T[]>;

  /**
   * Count entities matching criteria.
   */
  count(where?: WhereClause): Promise<number>;

  /**
   * Check if an entity exists.
   */
  exists(where: WhereClause): Promise<boolean>;
}

/**
 * IWriteRepository - Write operations
 *
 * Use this interface when a service only needs to modify data.
 * Supports dependency inversion without exposing read capabilities.
 */
export interface IWriteRepository<
  T,
  CreateDto = Partial<T>,
  UpdateDto = Partial<T>,
> {
  /**
   * Create a new entity.
   */
  create(data: CreateDto): Promise<T>;

  /**
   * Update an existing entity by ID.
   */
  update(id: string, data: UpdateDto): Promise<T>;

  /**
   * Delete an entity by ID.
   */
  delete(id: string): Promise<void>;
}

/**
 * IRepository - Combined CRUD operations (backward compatible)
 *
 * Use this interface when a service needs both read and write operations.
 * Extends both IReadRepository and IWriteRepository.
 */
export interface IRepository<T, CreateDto = Partial<T>, UpdateDto = Partial<T>>
  extends IReadRepository<T>,
    IWriteRepository<T, CreateDto, UpdateDto> {}

/**
 * ITransactionalRepository Interface
 * 
 * Extended repository interface with transaction support.
 * Prisma-specific but could be adapted to other ORMs.
 */
export type TransactionClient = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

export interface ITransactionalRepository<
  T,
  CreateDto = Partial<T>,
  UpdateDto = Partial<T>,
> extends IRepository<T, CreateDto, UpdateDto> {
  /**
   * Execute operations within a transaction.
   */
  transaction<R>(
    fn: (tx: TransactionClient) => Promise<R>,
  ): Promise<R>;
}
