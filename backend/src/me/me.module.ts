import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { UsersModule } from '../users/users.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [ConfigModule, UsersModule, ProgressModule],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
