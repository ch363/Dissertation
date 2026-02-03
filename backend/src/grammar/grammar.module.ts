import { Module } from '@nestjs/common';
import { GrammarService } from './grammar.service';

@Module({
  providers: [GrammarService],
  exports: [GrammarService],
})
export class GrammarModule {}
