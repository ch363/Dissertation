#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ContentImporterService } from '../src/content/importer/content-importer.service';
import { join } from 'path';

async function main() {
  const command = process.argv[2] || 'import';
  const contentDir = process.argv[3] || join(process.cwd(), 'content');

  console.log(`📦 Content Import Tool`);
  console.log(`   Command: ${command}`);
  console.log(`   Content directory: ${contentDir}\n`);

  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const importer = app.get(ContentImporterService);

  try {
    if (command === 'validate') {
      console.log('🔍 Validating content files...\n');
      const result = await importer.validateContent(contentDir);

      if (result.valid) {
        console.log('✅ All content files are valid!\n');
        process.exit(0);
      } else {
        console.error('❌ Validation failed:\n');
        for (const error of result.errors) {
          const path = error.path && error.path.length > 0 ? ` at ${error.path.join('.')}` : '';
          const line = error.line ? ` (line ${error.line})` : '';
          console.error(`  ${error.file}${path}${line}: ${error.message}`);
        }
        process.exit(1);
      }
    } else if (command === 'import') {
      console.log('📥 Importing content...\n');
      const stats = await importer.importContent(contentDir);

      console.log('\n📊 Import Summary:');
      console.log(`   Modules: ${stats.modulesCreated} created, ${stats.modulesUpdated} updated`);
      console.log(`   Lessons: ${stats.lessonsCreated} created, ${stats.lessonsUpdated} updated`);
      console.log(`   Teachings: ${stats.teachingsCreated} created, ${stats.teachingsUpdated} updated`);
      console.log(`   Questions: ${stats.questionsCreated} created, ${stats.questionsUpdated} updated`);
      console.log(`   Delivery Methods: ${stats.deliveryMethodsCreated} created`);

      if (stats.errors.length > 0) {
        console.log(`\n⚠️  ${stats.errors.length} error(s) occurred:`);
        for (const error of stats.errors) {
          console.error(`   - ${error}`);
        }
        process.exit(1);
      } else {
        console.log('\n✅ Import completed successfully!');
        process.exit(0);
      }
    } else {
      console.error(`Unknown command: ${command}`);
      console.error('Usage: npm run content:import [validate|import] [content-dir]');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await app.close();
  }
}

main();
