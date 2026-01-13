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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { SupabaseJwtGuard } from '../common/guards/supabase-jwt.guard';

@ApiTags('modules')
@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get()
  @ApiOperation({ summary: 'List all modules' })
  @ApiResponse({ status: 200, description: 'Modules retrieved' })
  findAll() {
    return this.modulesService.findAll();
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseJwtGuard)
  @ApiOperation({ summary: 'Create a new module' })
  @ApiResponse({ status: 201, description: 'Module created' })
  create(@Body() createDto: CreateModuleDto) {
    // TODO: Add admin check
    return this.modulesService.create(createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get module by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Module retrieved' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseJwtGuard)
  @ApiOperation({ summary: 'Update module' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Module updated' })
  update(@Param('id') id: string, @Body() updateDto: UpdateModuleDto) {
    // TODO: Add admin check
    return this.modulesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseJwtGuard)
  @ApiOperation({ summary: 'Delete module' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Module deleted' })
  remove(@Param('id') id: string) {
    // TODO: Add admin check
    return this.modulesService.remove(id);
  }

  @Get(':id/lessons')
  @ApiOperation({ summary: 'Get lessons for a module' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lessons retrieved' })
  findLessons(@Param('id') id: string) {
    return this.modulesService.findLessons(id);
  }
}
