/**
 * Repository Pattern Implementation
 * 
 * Demonstrates Dependency Inversion Principle:
 * - Services depend on IRepository abstraction
 * - Concrete implementations (PrismaRepository) satisfy the interface
 * 
 * Benefits:
 * - Testability: Mock repositories for unit tests
 * - Flexibility: Swap implementations without changing services
 * - Separation: Data access isolated from business logic
 * - Maintainability: Centralized data access patterns
 */

export * from './repository.interface';
export * from './prisma.repository';
