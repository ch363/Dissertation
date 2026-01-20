import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { SupabaseJwtGuard } from '../common/guards/supabase-jwt.guard';
import { IsUUID, IsOptional } from 'class-validator';

export class LessonsQueryDto {
  @IsOptional()
  @IsUUID()
  moduleId?: string;
}

@ApiTags('lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @ApiOperation({ summary: 'List all lessons' })
  @ApiQuery({
    name: 'moduleId',
    type: 'string',
    format: 'uuid',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Lessons retrieved' })
  findAll(@Query() query: LessonsQueryDto) {
    return this.lessonsService.findAll(query.moduleId);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseJwtGuard)
  @ApiOperation({ summary: 'Create a new lesson' })
  @ApiResponse({ status: 201, description: 'Lesson created' })
  create(@Body() createDto: CreateLessonDto) {
    // TODO: Add admin check
    return this.lessonsService.create(createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lesson by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lesson retrieved' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseJwtGuard)
  @ApiOperation({ summary: 'Update lesson' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lesson updated' })
  update(@Param('id') id: string, @Body() updateDto: UpdateLessonDto) {
    // TODO: Add admin check
    return this.lessonsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseJwtGuard)
  @ApiOperation({ summary: 'Delete lesson' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lesson deleted' })
  remove(@Param('id') id: string) {
    // TODO: Add admin check
    return this.lessonsService.remove(id);
  }

  @Get(':id/teachings')
  @ApiOperation({ summary: 'Get teachings for a lesson' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Teachings retrieved' })
  findTeachings(@Param('id') id: string) {
    return this.lessonsService.findTeachings(id);
  }

  @Get('recommended')
  @ApiOperation({
    summary: 'Get recommended lessons (curated + algorithmic discovery)',
  })
  @ApiQuery({
    name: 'userId',
    type: 'string',
    format: 'uuid',
    required: false,
    description: 'Optional: for personalized recommendations',
  })
  @ApiResponse({ status: 200, description: 'Recommended lessons retrieved' })
  findRecommended(@Query('userId') userId?: string) {
    return this.lessonsService.findRecommended(userId);
  }
}
