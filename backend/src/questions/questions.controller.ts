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
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateDeliveryMethodsDto } from './dto/update-delivery-methods.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { IsUUID, IsOptional } from 'class-validator';

export class QuestionsQueryDto {
  @IsOptional()
  @IsUUID()
  teachingId?: string;
}

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  findAll(@Query() query: QuestionsQueryDto) {
    return this.questionsService.findAll(query.teachingId);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  create(@Body() createDto: CreateQuestionDto) {
    // TODO: Add admin check
    return this.questionsService.create(createDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  remove(@Param('id') id: string) {
    // TODO: Add admin check
    return this.questionsService.remove(id);
  }

  @Put(':id/delivery-methods')
  @UseGuards(SupabaseAuthGuard)
  updateDeliveryMethods(
    @Param('id') id: string,
    @Body() updateDto: UpdateDeliveryMethodsDto,
  ) {
    // TODO: Add admin check
    return this.questionsService.updateDeliveryMethods(id, updateDto.deliveryMethods);
  }
}
