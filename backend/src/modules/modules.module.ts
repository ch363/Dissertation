import { Module } from '@nestjs/common';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { ModuleRepository } from './modules.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ModulesController],
  providers: [ModuleRepository, ModulesService],
  exports: [ModulesService],
})
export class ModulesModule {}
