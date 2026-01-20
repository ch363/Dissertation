import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { SupabaseJwtGuard } from '../common/guards/supabase-jwt.guard';
import { User } from '../common/decorators/user.decorator';
import {
  SaveOnboardingDto,
  OnboardingResponseDto,
  HasOnboardingResponseDto,
} from './dto/onboarding.dto';

@ApiTags('onboarding')
@ApiBearerAuth('JWT-auth')
@Controller('onboarding')
@UseGuards(SupabaseJwtGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post()
  @ApiOperation({ summary: 'Save onboarding answers' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding saved successfully',
    type: OnboardingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async saveOnboarding(
    @User() userId: string,
    @Body() dto: SaveOnboardingDto,
  ): Promise<OnboardingResponseDto> {
    return this.onboardingService.saveOnboarding(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get onboarding answers' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding retrieved',
    type: OnboardingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Onboarding not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOnboarding(
    @User() userId: string,
  ): Promise<OnboardingResponseDto | null> {
    return this.onboardingService.getOnboarding(userId);
  }

  @Get('has')
  @ApiOperation({ summary: 'Check if user has completed onboarding' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding status retrieved',
    type: HasOnboardingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async hasOnboarding(
    @User() userId: string,
  ): Promise<HasOnboardingResponseDto> {
    const hasOnboarding = await this.onboardingService.hasOnboarding(userId);
    return { hasOnboarding };
  }
}
