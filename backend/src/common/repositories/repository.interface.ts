import { Prisma } from '@prisma/client';

/**
 * IRepository Interface
 * 
 * Generic repository interface for data access operations.
 * Demonstrates Dependency Inversion Principle:
 * - High-level services depend on this abstraction
 * - Low-level implementations (PrismaRepository) implement this interface
 * 
 * Benefits:
 * - Testability: Easy to mock for unit tests
 * - Flexibility: Can swap implementations (e.g., in-memory, different ORMs)
 * - Separation of Concerns: Data access logic isolated from business logic
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

export interface IRepository<T, CreateDto = Partial<T>, UpdateDto = Partial<T>> {
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
