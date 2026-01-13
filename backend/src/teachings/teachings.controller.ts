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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TeachingsService } from './teachings.service';
import { CreateTeachingDto } from './dto/create-teaching.dto';
import { UpdateTeachingDto } from './dto/update-teaching.dto';
import { SupabaseJwtGuard } from '../common/guards/supabase-jwt.guard';
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
  @ApiOperation({ summary: 'List all teachings' })
  @ApiQuery({ name: 'lessonId', type: 'string', format: 'uuid', required: false })
  @ApiResponse({ status: 200, description: 'Teachings retrieved' })
  findAll(@Query() query: TeachingsQueryDto) {
    return this.teachingsService.findAll(query.lessonId);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseJwtGuard)
  @ApiOperation({ summary: 'Create a new teaching' })
  @ApiResponse({ status: 201, description: 'Teaching created' })
  create(@Body() createDto: CreateTeachingDto) {
    // TODO: Add admin check
    return this.teachingsService.create(createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get teaching by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Teaching retrieved' })
  @ApiResponse({ status: 404, description: 'Teaching not found' })
  findOne(@Param('id') id: string) {
    return this.teachingsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseJwtGuard)
  @ApiOperation({ summary: 'Update teaching' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Teaching updated' })
  update(@Param('id') id: string, @Body() updateDto: UpdateTeachingDto) {
    // TODO: Add admin check
    return this.teachingsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseJwtGuard)
  @ApiOperation({ summary: 'Delete teaching' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Teaching deleted' })
  remove(@Param('id') id: string) {
    // TODO: Add admin check
    return this.teachingsService.remove(id);
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Get questions for a teaching' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Questions retrieved' })
  findQuestions(@Param('id') id: string) {
    return this.teachingsService.findQuestions(id);
  }
}
