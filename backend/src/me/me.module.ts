import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [UsersModule, PrismaModule],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
