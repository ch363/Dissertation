import {
  isMissingColumnOrSchemaMismatchError,
  isPrismaNotFoundError,
  isPrismaUniqueConstraintError,
  isPrismaForeignKeyError,
} from '../prisma-error.util';

describe('PrismaErrorUtil', () => {
  describe('isMissingColumnOrSchemaMismatchError', () => {
    it('should detect missing column errors', () => {
      const error = new Error('Column does not exist in the current database');
      expect(isMissingColumnOrSchemaMismatchError(error)).toBe(true);
    });

    it('should detect schema mismatch errors', () => {
      const error = new Error('Field (not available)');
      expect(isMissingColumnOrSchemaMismatchError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new Error('Some other error');
      expect(isMissingColumnOrSchemaMismatchError(error)).toBe(false);
    });
  });

  describe('isPrismaNotFoundError', () => {
    it('should detect not found errors', () => {
      const error = new Error('Record to update not found');
      expect(isPrismaNotFoundError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new Error('Some other error');
      expect(isPrismaNotFoundError(error)).toBe(false);
    });
  });

  describe('isPrismaUniqueConstraintError', () => {
    it('should detect unique constraint errors', () => {
      const error = new Error('Unique constraint failed on the fields');
      expect(isPrismaUniqueConstraintError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new Error('Some other error');
      expect(isPrismaUniqueConstraintError(error)).toBe(false);
    });
  });

  describe('isPrismaForeignKeyError', () => {
    it('should detect foreign key errors', () => {
      const error = new Error('Foreign key constraint failed on the field');
      expect(isPrismaForeignKeyError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new Error('Some other error');
      expect(isPrismaForeignKeyError(error)).toBe(false);
    });
  });
});
