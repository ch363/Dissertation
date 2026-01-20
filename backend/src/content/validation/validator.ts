import { z } from 'zod';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import {
  ModuleContentSchema,
  LessonContentSchema,
  ModuleContent,
  LessonContent,
} from './content.schema';

export interface ValidationError {
  file: string;
  line?: number;
  message: string;
  path?: string[];
}

/**
 * Parse and validate a YAML file
 */
export function parseYamlFile<T>(filePath: string, schema: z.ZodSchema<T>): T {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = yaml.load(content, {
      filename: filePath,
      onWarning: (warning) => {
        console.warn(`YAML warning in ${filePath}:`, warning.message);
      },
    });

    // Validate with Zod
    const result = schema.safeParse(data);
    if (!result.success) {
      const errors: ValidationError[] = result.error.errors.map((err) => ({
        file: filePath,
        line: err.path.length > 0 ? undefined : undefined, // YAML line numbers are tricky
        message: err.message,
        path: err.path.map(String),
      }));

      throw new ValidationErrorException(
        `Validation failed for ${filePath}:\n${formatValidationErrors(errors)}`,
        errors,
      );
    }

    return result.data;
  } catch (error) {
    if (error instanceof ValidationErrorException) {
      throw error;
    }
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        file: filePath,
        message: err.message,
        path: err.path.map(String),
      }));
      throw new ValidationErrorException(
        `Validation failed for ${filePath}:\n${formatValidationErrors(errors)}`,
        errors,
      );
    }
    throw new Error(
      `Failed to parse ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Format validation errors for display
 */
function formatValidationErrors(errors: ValidationError[]): string {
  return errors
    .map((err) => {
      const path =
        err.path && err.path.length > 0 ? ` at ${err.path.join('.')}` : '';
      const line = err.line ? ` (line ${err.line})` : '';
      return `  - ${err.message}${path}${line}`;
    })
    .join('\n');
}

/**
 * Custom error class for validation errors
 */
export class ValidationErrorException extends Error {
  constructor(
    message: string,
    public readonly errors: ValidationError[] = [],
  ) {
    super(message);
    this.name = 'ValidationErrorException';
  }
}

/**
 * Validate a module YAML file
 */
export function validateModuleFile(filePath: string): ModuleContent {
  return parseYamlFile(filePath, ModuleContentSchema);
}

/**
 * Validate a lesson YAML file
 */
export function validateLessonFile(filePath: string): LessonContent {
  return parseYamlFile(filePath, LessonContentSchema);
}

/**
 * Find and validate all content files in a directory
 */
export function findContentFiles(contentDir: string): {
  modules: string[];
  lessons: string[];
} {
  const { readdirSync, statSync } = require('fs');
  const modules: string[] = [];
  const lessons: string[] = [];

  function walkDir(dir: string, relativePath: string = '') {
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          walkDir(fullPath, join(relativePath, entry));
        } else if (entry === 'module.yaml') {
          modules.push(fullPath);
        } else if (
          entry.endsWith('.yaml') &&
          relativePath.includes('lessons')
        ) {
          lessons.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
      console.warn(
        `Warning: Could not read directory ${dir}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  walkDir(contentDir);
  return { modules, lessons };
}
