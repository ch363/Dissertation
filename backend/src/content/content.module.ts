import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ContentImporterService } from './importer/content-importer.service';
import { ContentLookupService } from './content-lookup.service';

@Module({
  imports: [PrismaModule],
  providers: [ContentImporterService, ContentLookupService],
  exports: [ContentImporterService, ContentLookupService],
})
export class ContentModule {}
