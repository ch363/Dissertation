# Prisma Service Usage

## Basic Usage

The `PrismaService` is now available globally throughout your NestJS application. Here's how to use it:

### In a Service

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class YourService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.module.findMany();
  }

  async findOne(id: string) {
    return this.prisma.module.findUnique({
      where: { id },
    });
  }

  async create(data: { title: string; description?: string }) {
    return this.prisma.module.create({
      data,
    });
  }
}
```

### In a Controller

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('modules')
export class ModulesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll() {
    return this.prisma.module.findMany();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.module.findUnique({
      where: { id },
    });
  }
}
```

## Using Direct Database Adapter (Optional)

If you want to use the direct database connection adapter (recommended for production with connection pooling), uncomment the code in `prisma.service.ts` and comment out the simple `super()` call.

This will use `@prisma/adapter-pg` for better connection management.
