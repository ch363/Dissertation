import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get()
  findAll() {
    return this.modulesService.findAll();
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  create(@Body() createDto: CreateModuleDto) {
    // TODO: Add admin check
    return this.modulesService.create(createDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  update(@Param('id') id: string, @Body() updateDto: UpdateModuleDto) {
    // TODO: Add admin check
    return this.modulesService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  remove(@Param('id') id: string) {
    // TODO: Add admin check
    return this.modulesService.remove(id);
  }

  @Get(':id/lessons')
  findLessons(@Param('id') id: string) {
    return this.modulesService.findLessons(id);
  }
}
