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
import { TeachingsService } from './teachings.service';
import { CreateTeachingDto } from './dto/create-teaching.dto';
import { UpdateTeachingDto } from './dto/update-teaching.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { IsUUID, IsOptional } from 'class-validator';

export class TeachingsQueryDto {
  @IsOptional()
  @IsUUID()
  lessonId?: string;
}

@Controller('teachings')
export class TeachingsController {
  constructor(private readonly teachingsService: TeachingsService) {}

  @Get()
  findAll(@Query() query: TeachingsQueryDto) {
    return this.teachingsService.findAll(query.lessonId);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  create(@Body() createDto: CreateTeachingDto) {
    // TODO: Add admin check
    return this.teachingsService.create(createDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teachingsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  update(@Param('id') id: string, @Body() updateDto: UpdateTeachingDto) {
    // TODO: Add admin check
    return this.teachingsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  remove(@Param('id') id: string) {
    // TODO: Add admin check
    return this.teachingsService.remove(id);
  }

  @Get(':id/questions')
  findQuestions(@Param('id') id: string) {
    return this.teachingsService.findQuestions(id);
  }
}
