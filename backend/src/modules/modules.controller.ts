import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { AdminPost, AdminPatch, AdminDelete } from '../common/decorators/admin-endpoint.decorator';

@ApiTags('modules')
@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get()
  findAll() {
    return this.modulesService.findAll();
  }

  @Post()
  @AdminPost('Module')
  create(@Body() createDto: CreateModuleDto) {
    return this.modulesService.create(createDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }

  @Patch(':id')
  @AdminPatch('Module')
  update(@Param('id') id: string, @Body() updateDto: UpdateModuleDto) {
    return this.modulesService.update(id, updateDto);
  }

  @Delete(':id')
  @AdminDelete('Module')
  remove(@Param('id') id: string) {
    return this.modulesService.remove(id);
  }

  @Get(':id/lessons')
  findLessons(@Param('id') id: string) {
    return this.modulesService.findLessons(id);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Curated + algorithmic discovery' })
  findFeatured() {
    return this.modulesService.findFeatured();
  }
}
