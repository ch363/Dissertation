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
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { IsUUID, IsOptional } from 'class-validator';

export class LessonsQueryDto {
  @IsOptional()
  @IsUUID()
  moduleId?: string;
}

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  findAll(@Query() query: LessonsQueryDto) {
    return this.lessonsService.findAll(query.moduleId);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  create(@Body() createDto: CreateLessonDto) {
    // TODO: Add admin check
    return this.lessonsService.create(createDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  update(@Param('id') id: string, @Body() updateDto: UpdateLessonDto) {
    // TODO: Add admin check
    return this.lessonsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  remove(@Param('id') id: string) {
    // TODO: Add admin check
    return this.lessonsService.remove(id);
  }

  @Get(':id/teachings')
  findTeachings(@Param('id') id: string) {
    return this.lessonsService.findTeachings(id);
  }
}
