import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ContentImporterService } from './importer/content-importer.service';
import { ContentLookupService } from './content-lookup.service';
import { OptionsGeneratorService } from './options-generator.service';

@Module({
  imports: [PrismaModule],
  providers: [
    ContentImporterService,
    ContentLookupService,
    OptionsGeneratorService,
  ],
  exports: [
    ContentImporterService,
    ContentLookupService,
    OptionsGeneratorService,
  ],
})
export class ContentModule {}
