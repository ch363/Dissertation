import {
  Controller,
  Get,
  Patch,
  Body,
  Post,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MeService } from './me.service';
import { UsersService } from '../users/users.service';
import { SupabaseJwtGuard } from '../common/guards/supabase-jwt.guard';
import { User } from '../common/decorators/user.decorator';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { ResetProgressDto } from '../progress/dto/reset-progress.dto';
import { EnsureProfileDto } from './dto/ensure-profile.dto';
import { UploadAvatarDto } from './dto/upload-avatar.dto';

@ApiTags('me')
@ApiBearerAuth('JWT-auth')
@Controller('me')
@UseGuards(SupabaseJwtGuard)
export class MeController {
  constructor(
    private readonly meService: MeService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Provisioning endpoint' })
  async getMe(@User() userId: string) {
    return this.meService.getMe(userId);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Alias for GET /me' })
  async getProfile(@User() userId: string) {
    return this.meService.getMe(userId);
  }

  @Post('profile/ensure')
  @ApiOperation({ summary: 'Provisioning with optional name' })
  async ensureProfile(@User() userId: string, @Body() dto: EnsureProfileDto) {
    const user = await this.meService.getMe(userId);
    if (dto.name && dto.name !== user.name) {
      return this.usersService.updateUser(userId, { name: dto.name });
    }
    return user;
  }

  @Patch()
  async updateMe(@User() userId: string, @Body() updateDto: UpdateUserDto) {
    return this.usersService.updateUser(userId, updateDto);
  }

  @Get('dashboard')
  async getDashboard(
    @User() userId: string,
    @Query('tzOffsetMinutes') tzOffsetMinutes?: string,
  ) {
    const parsed = tzOffsetMinutes !== undefined ? Number(tzOffsetMinutes) : undefined;
    return this.meService.getDashboard(userId, Number.isFinite(parsed) ? parsed : undefined);
  }

  @Get('stats')
  @ApiQuery({ name: 'tzOffsetMinutes', required: false, type: Number })
  async getStats(
    @User() userId: string,
    @Query('tzOffsetMinutes') tzOffsetMinutes?: string,
  ) {
    const parsed = tzOffsetMinutes !== undefined ? Number(tzOffsetMinutes) : undefined;
    return this.meService.getStats(userId, Number.isFinite(parsed) ? parsed : undefined);
  }

  @Get('lessons')
  async getMyLessons(@User() userId: string) {
    return this.meService.getMyLessons(userId);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Continue where you left off' })
  async getRecent(@User() userId: string) {
    return this.meService.getRecent(userId);
  }

  @Get('mastery')
  async getAllMastery(@User() userId: string) {
    return this.meService.getAllMastery(userId);
  }

  @Post('reset')
  async resetProgress(
    @User() userId: string,
    @Body() resetDto: ResetProgressDto,
  ) {
    return this.meService.resetAllProgress(userId, resetDto);
  }

  @Delete()
  async deleteAccount(@User() userId: string) {
    return this.meService.deleteAccount(userId);
  }

  @Post('avatar')
  async uploadAvatar(@User() userId: string, @Body() dto: UploadAvatarDto) {
    return this.usersService.updateUser(userId, { avatarUrl: dto.avatarUrl });
  }
}
