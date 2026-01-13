import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { UsersModule } from '../users/users.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [UsersModule, ProgressModule],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
