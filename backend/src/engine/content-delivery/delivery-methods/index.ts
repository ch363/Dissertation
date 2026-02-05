/**
 * Delivery Method Registry Module
 * 
 * Demonstrates Strategy Pattern and Open/Closed Principle.
 * To add a new delivery method:
 * 1. Create a new strategy class implementing DeliveryMethodStrategy
 * 2. Register it in the module providers
 * 3. No changes needed to existing code
 */

export { DeliveryMethodStrategy } from './delivery-method-strategy.interface';
export { DeliveryMethodRegistry } from './delivery-method-registry';
export * from './strategies';
