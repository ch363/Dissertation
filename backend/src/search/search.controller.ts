import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Search modules, lessons, teachings, and questions',
  })
  @ApiQuery({
    name: 'q',
    type: 'string',
    required: false,
    description: 'Search query text',
  })
  @ApiQuery({
    name: 'level',
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    required: false,
  })
  @ApiQuery({ name: 'topic', type: 'string', required: false })
  @ApiQuery({
    name: 'type',
    enum: ['module', 'lesson', 'teaching', 'question'],
    required: false,
  })
  @ApiQuery({ name: 'limit', type: 'number', required: false, default: 20 })
  @ApiQuery({ name: 'offset', type: 'number', required: false, default: 0 })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  async search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query);
  }
}
