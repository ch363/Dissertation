import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import {
  AdminPost,
  AdminPatch,
  AdminDelete,
} from '../common/decorators/admin-endpoint.decorator';
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
  findAll(@Query() query: LessonsQueryDto) {
    return this.lessonsService.findAll(query.moduleId);
  }

  @Post()
  @AdminPost('Lesson')
  create(@Body() createDto: CreateLessonDto) {
    return this.lessonsService.create(createDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  @Patch(':id')
  @AdminPatch('Lesson')
  update(@Param('id') id: string, @Body() updateDto: UpdateLessonDto) {
    return this.lessonsService.update(id, updateDto);
  }

  @Delete(':id')
  @AdminDelete('Lesson')
  remove(@Param('id') id: string) {
    return this.lessonsService.remove(id);
  }

  @Get(':id/teachings')
  findTeachings(@Param('id') id: string) {
    return this.lessonsService.findTeachings(id);
  }

  @Get('recommended')
  @ApiOperation({ summary: 'Curated + algorithmic discovery' })
  findRecommended(@Query('userId') userId?: string) {
    return this.lessonsService.findRecommended(userId);
  }
}
