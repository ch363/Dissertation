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
import { TeachingsService } from './teachings.service';
import { CreateTeachingDto } from './dto/create-teaching.dto';
import { UpdateTeachingDto } from './dto/update-teaching.dto';
import { AdminPost, AdminPatch, AdminDelete } from '../common/decorators/admin-endpoint.decorator';
import { IsUUID, IsOptional } from 'class-validator';

export class TeachingsQueryDto {
  @IsOptional()
  @IsUUID()
  lessonId?: string;
}

@ApiTags('teachings')
@Controller('teachings')
export class TeachingsController {
  constructor(private readonly teachingsService: TeachingsService) {}

  @Get()
  findAll(@Query() query: TeachingsQueryDto) {
    return this.teachingsService.findAll(query.lessonId);
  }

  @Post()
  @AdminPost('Teaching')
  create(@Body() createDto: CreateTeachingDto) {
    return this.teachingsService.create(createDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teachingsService.findOne(id);
  }

  @Patch(':id')
  @AdminPatch('Teaching')
  update(@Param('id') id: string, @Body() updateDto: UpdateTeachingDto) {
    return this.teachingsService.update(id, updateDto);
  }

  @Delete(':id')
  @AdminDelete('Teaching')
  remove(@Param('id') id: string) {
    return this.teachingsService.remove(id);
  }

  @Get(':id/questions')
  findQuestions(@Param('id') id: string) {
    return this.teachingsService.findQuestions(id);
  }
}
