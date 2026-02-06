import { Injectable, OnModuleInit } from '@nestjs/common';
import { DELIVERY_METHOD } from '@prisma/client';
import { DeliveryMethodStrategy } from './delivery-method-strategy.interface';
import {
  MultipleChoiceStrategy,
  FillBlankStrategy,
  TextTranslationStrategy,
} from './strategies';

/**
 * DeliveryMethodRegistry
 * 
 * Registry pattern for managing delivery method strategies.
 * Demonstrates:
 * - Strategy Pattern: Encapsulates delivery method algorithms
 * - Open/Closed Principle: Open for extension (new strategies), closed for modification
 * - Dependency Inversion: Depends on DeliveryMethodStrategy abstraction
 * 
 * Usage:
 * ```
 * const strategy = registry.get(DELIVERY_METHOD.MULTIPLE_CHOICE);
 * const stepItem = strategy.buildStepItem(question, variant, teaching, lessonId);
 * ```
 */
@Injectable()
export class DeliveryMethodRegistry implements OnModuleInit {
  private strategies = new Map<DELIVERY_METHOD, DeliveryMethodStrategy>();

  constructor(
    private readonly mcStrategy: MultipleChoiceStrategy,
    private readonly fbStrategy: FillBlankStrategy,
    private readonly ttStrategy: TextTranslationStrategy,
  ) {}

  /**
   * Register all strategies on module initialization.
   */
  onModuleInit() {
    this.register(this.mcStrategy);
    this.register(this.fbStrategy);
    this.register(this.ttStrategy);
  }

  /**
   * Register a strategy for a delivery method.
   */
  register(strategy: DeliveryMethodStrategy): void {
    const method = strategy.getMethod();
    if (this.strategies.has(method)) {
      throw new Error(
        `Strategy for ${method} is already registered`,
      );
    }
    this.strategies.set(method, strategy);
  }

  /**
   * Get strategy for a delivery method.
   * Throws if strategy not found.
   */
  get(method: DELIVERY_METHOD): DeliveryMethodStrategy {
    const strategy = this.strategies.get(method);
    if (!strategy) {
      throw new Error(
        `No strategy registered for delivery method: ${method}`,
      );
    }
    return strategy;
  }

  /**
   * Check if a strategy is registered for a delivery method.
   */
  has(method: DELIVERY_METHOD): boolean {
    return this.strategies.has(method);
  }

  /**
   * Get all registered delivery methods.
   */
  getRegisteredMethods(): DELIVERY_METHOD[] {
    return Array.from(this.strategies.keys());
  }
}
