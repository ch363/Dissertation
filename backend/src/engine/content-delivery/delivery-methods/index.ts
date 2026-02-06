/**
 * Delivery Method Registry Module
 * 
 * Demonstrates Strategy Pattern, Open/Closed Principle, and Interface Segregation.
 * 
 * To add a new delivery method:
 * 1. Create a new strategy class implementing DeliveryMethodStrategy
 * 2. Register it in the module providers
 * 3. No changes needed to existing code
 * 
 * ISP: Consumers can depend on specific interfaces:
 * - IStepItemBuilder: For building step items only
 * - IAnswerValidator: For validating answers only
 * - IExerciseMetadata: For exercise classification only
 */

// Segregated interfaces (ISP)
export type {
  IDeliveryMethodIdentifier,
  IStepItemBuilder,
  IAnswerValidator,
  IExerciseMetadata,
} from './delivery-method-strategy.interface';

// Combined interface (backward compatible)
export type { DeliveryMethodStrategy } from './delivery-method-strategy.interface';

// Data types
export type {
  QuestionData,
  ValidationResult,
  PromptContext,
  PracticeStepItem,
} from './delivery-method-strategy.interface';

export { DeliveryMethodRegistry } from './delivery-method-registry';
export * from './strategies';
