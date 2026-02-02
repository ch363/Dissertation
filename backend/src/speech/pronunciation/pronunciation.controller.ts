import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SupabaseJwtGuard } from '../../common/guards/supabase-jwt.guard';
import { PronunciationScoreRequestDto } from './dto/pronunciation-score.request.dto';
import { PronunciationScoreDto } from './dto/pronunciation-score.dto';
import { PronunciationService } from './pronunciation.service';

@ApiTags('speech')
@ApiBearerAuth('JWT-auth')
@Controller('speech')
@UseGuards(SupabaseJwtGuard)
export class PronunciationController {
  constructor(private readonly pronunciationService: PronunciationService) {}

  @Post('pronunciation-score')
  @ApiOperation({
    summary: 'Score pronunciation via Azure Pronunciation Assessment',
  })
  @ApiResponse({
    status: 200,
    description: 'Pronunciation scored',
    type: PronunciationScoreDto,
  })
  async scorePronunciation(
    @Body() dto: PronunciationScoreRequestDto,
  ): Promise<PronunciationScoreDto> {
    const result = await this.pronunciationService.assess({
      audioBase64: dto.audioBase64,
      referenceText: dto.referenceText,
      locale: dto.locale,
    });

    return {
      locale: result.locale,
      referenceText: result.referenceText,
      scores: result.scores,
      words: result.words,
    };
  }
}
