import { Module } from '@nestjs/common';
import { PronunciationController } from './pronunciation/pronunciation.controller';
import { PronunciationService } from './pronunciation/pronunciation.service';

@Module({
  controllers: [PronunciationController],
  providers: [PronunciationService],
  exports: [PronunciationService],
})
export class SpeechModule {}
