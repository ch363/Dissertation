import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRepository } from './users.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    UserRepository,
    {
      provide: 'IUserRepository',
      useExisting: UserRepository,
    },
    UsersService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
