import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateDeliveryMethodsDto } from './dto/update-delivery-methods.dto';
import {
  AdminPost,
  AdminDelete,
  AdminProtected,
} from '../common/decorators/admin-endpoint.decorator';
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
  findAll(@Query() query: QuestionsQueryDto) {
    return this.questionsService.findAllByTeaching(query.teachingId);
  }

  @Post()
  @AdminPost('Question')
  create(@Body() createDto: CreateQuestionDto) {
    return this.questionsService.create(createDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Delete(':id')
  @AdminDelete('Question')
  remove(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }

  @Put(':id/delivery-methods')
  @AdminProtected(
    'Replace delivery methods for a question',
    'Delivery methods updated',
  )
  updateDeliveryMethods(
    @Param('id') id: string,
    @Body() updateDto: UpdateDeliveryMethodsDto,
  ) {
    return this.questionsService.updateDeliveryMethods(
      id,
      updateDto.deliveryMethods,
    );
  }
}
