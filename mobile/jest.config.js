/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/', '<rootDir>/src/__tests__/helpers/'],
  moduleNameMapper: {
    '^@/api/(.*)$': '<rootDir>/src/services/api/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/features/(.*)$': '<rootDir>/src/features/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
};
