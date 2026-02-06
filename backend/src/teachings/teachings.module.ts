import { Module } from '@nestjs/common';
import { TeachingsController } from './teachings.controller';
import { TeachingsService } from './teachings.service';
import { TeachingRepository } from './teachings.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TeachingsController],
  providers: [TeachingRepository, TeachingsService],
  exports: [TeachingsService, TeachingRepository],
})
export class TeachingsModule {}
