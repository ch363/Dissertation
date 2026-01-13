import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateDeliveryMethodsDto } from './dto/update-delivery-methods.dto';
import { SupabaseJwtGuard } from '../common/guards/supabase-jwt.guard';
import { IsUUID, IsOptional } from 'class-validator';

export class QuestionsQueryDto {
  @IsOptional()
  @IsUUID()
  teachingId?: string;
}

@ApiTags('questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all questions' })
  @ApiQuery({ name: 'teachingId', type: 'string', format: 'uuid', required: false })
  @ApiResponse({ status: 200, description: 'Questions retrieved' })
  findAll(@Query() query: QuestionsQueryDto) {
    return this.questionsService.findAll(query.teachingId);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseJwtGuard)
  @ApiOperation({ summary: 'Create a new question' })
  @ApiResponse({ status: 201, description: 'Question created' })
  create(@Body() createDto: CreateQuestionDto) {
    // TODO: Add admin check
    return this.questionsService.create(createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get question by ID with delivery methods' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Question retrieved' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseJwtGuard)
  @ApiOperation({ summary: 'Delete question' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Question deleted' })
  remove(@Param('id') id: string) {
    // TODO: Add admin check
    return this.questionsService.remove(id);
  }

  @Put(':id/delivery-methods')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseJwtGuard)
  @ApiOperation({ summary: 'Replace delivery methods for a question' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Delivery methods updated' })
  updateDeliveryMethods(
    @Param('id') id: string,
    @Body() updateDto: UpdateDeliveryMethodsDto,
  ) {
    // TODO: Add admin check
    return this.questionsService.updateDeliveryMethods(id, updateDto.deliveryMethods);
  }
}
