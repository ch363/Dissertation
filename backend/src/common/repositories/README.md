# Repository Pattern

This directory contains the repository pattern implementation demonstrating the **Dependency Inversion Principle** (SOLID).

## Architecture

```
┌─────────────────────────────────────────┐
│         Services (High-Level)           │
│  ProgressService, SessionPlanService    │
└───────────────┬─────────────────────────┘
                │ depends on
                ▼
┌─────────────────────────────────────────┐
│    IRepository Interface (Abstraction)  │
│         (Dependency Inversion)          │
└───────────────┬─────────────────────────┘
                │ implemented by
                ▼
┌─────────────────────────────────────────┐
│  PrismaRepository (Low-Level)           │
│       Concrete Implementation           │
└─────────────────────────────────────────┘
```

## Usage

### 1. Create a Domain Repository

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '../common/repositories';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserRepository extends PrismaRepository<
  User,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'user');
  }

  // Add domain-specific methods
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async findActiveUsers(): Promise<User[]> {
    return this.findAll({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

### 2. Use in Services

```typescript
@Injectable()
export class UserService {
  constructor(
    // Depend on abstraction, not concrete implementation
    private userRepository: UserRepository,
  ) {}

  async getUser(id: string) {
    return this.userRepository.findById(id);
  }

  async createUser(dto: CreateUserDto) {
    return this.userRepository.create(dto);
  }
}
```

### 3. Testing with Mocks

```typescript
describe('UserService', () => {
  let service: UserService;
  let mockRepository: MockType<UserRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      // ... other methods
    };

    service = new UserService(mockRepository as any);
  });

  it('should get user by id', async () => {
    const user = { id: '1', email: 'test@example.com' };
    mockRepository.findById.mockResolvedValue(user);

    const result = await service.getUser('1');

    expect(result).toEqual(user);
    expect(mockRepository.findById).toHaveBeenCalledWith('1');
  });
});
```

## Benefits

### 1. Testability
- Easy to mock repositories in unit tests
- Test business logic without database

### 2. Flexibility
- Swap implementations (e.g., in-memory for testing)
- Migrate to different ORMs without changing services

### 3. Separation of Concerns
- Data access isolated from business logic
- Services don't need to know about Prisma specifics

### 4. Maintainability
- Centralized data access patterns
- Consistent error handling
- Type-safe operations

## SOLID Principles Demonstrated

### Dependency Inversion Principle (D)
- **High-level modules** (services) depend on **abstractions** (IRepository)
- **Low-level modules** (PrismaRepository) implement abstractions
- Both depend on the same abstraction

### Single Responsibility Principle (S)
- Repositories handle data access only
- Services handle business logic only

### Open/Closed Principle (O)
- Open for extension: Create new repositories by extending PrismaRepository
- Closed for modification: Base class doesn't need changes

### Interface Segregation Principle (I)
- IRepository provides only essential methods
- Domain repositories add specific methods as needed

## Advanced Features

### Transactions

```typescript
await userRepository.transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.profile.create({ data: { userId: user.id, ...profileData } });
  return user;
});
```

### Complex Queries

```typescript
class QuestionRepository extends PrismaRepository<Question> {
  async findWithTeaching(id: string) {
    return this.getModel().findUnique({
      where: { id },
      include: {
        teaching: {
          include: {
            skillTags: true,
          },
        },
      },
    });
  }
}
```

### Raw SQL (when needed)

```typescript
async findByComplexCriteria() {
  return this.executeRaw(`
    SELECT * FROM users
    WHERE created_at > NOW() - INTERVAL '30 days'
    AND status IN ('active', 'pending')
  `);
}
```
