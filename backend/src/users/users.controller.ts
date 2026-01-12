import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { UserId } from '../auth/user-id.decorator';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('me')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getMe(@UserId() userId: string) {
    // Upsert user on /me call (provisioning)
    return this.usersService.upsertUser(userId);
  }

  @Patch()
  async updateMe(@UserId() userId: string, @Body() updateDto: UpdateUserDto) {
    return this.usersService.updateUser(userId, updateDto);
  }

  @Get('dashboard')
  async getDashboard(@UserId() userId: string) {
    return this.usersService.getDashboard(userId);
  }

  @Get('lessons')
  async getMyLessons(@UserId() userId: string) {
    return this.usersService.getMyLessons(userId);
  }
}
