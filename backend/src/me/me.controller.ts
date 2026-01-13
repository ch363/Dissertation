import { Controller, Get, Patch, Body, Post, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MeService } from './me.service';
import { UsersService } from '../users/users.service';
import { SupabaseJwtGuard } from '../common/guards/supabase-jwt.guard';
import { User } from '../common/decorators/user.decorator';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { ResetProgressDto } from '../progress/dto/reset-progress.dto';

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
  @ApiOperation({ summary: 'Get current user (provisioning endpoint)' })
  @ApiResponse({ status: 200, description: 'User retrieved or created' })
  async getMe(@User() userId: string) {
    // Provision user on first request
    return this.meService.getMe(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateMe(@User() userId: string, @Body() updateDto: UpdateUserDto) {
    return this.usersService.updateUser(userId, updateDto);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get user dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  async getDashboard(@User() userId: string) {
    return this.meService.getDashboard(userId);
  }

  @Get('lessons')
  @ApiOperation({ summary: 'Get user\'s started lessons with progress' })
  @ApiResponse({ status: 200, description: 'User lessons retrieved' })
  async getMyLessons(@User() userId: string) {
    return this.meService.getMyLessons(userId);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent activity - continue where you left off' })
  @ApiResponse({ status: 200, description: 'Recent activity retrieved' })
  async getRecent(@User() userId: string) {
    return this.meService.getRecent(userId);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset all user progress (or scoped)' })
  @ApiResponse({ status: 200, description: 'Progress reset successfully' })
  async resetProgress(
    @User() userId: string,
    @Body() resetDto: ResetProgressDto,
  ) {
    return this.meService.resetAllProgress(userId, resetDto);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete user account and all associated data' })
  @ApiResponse({ status: 200, description: 'Account deletion requested/processed' })
  async deleteAccount(@User() userId: string) {
    return this.meService.deleteAccount(userId);
  }
}
