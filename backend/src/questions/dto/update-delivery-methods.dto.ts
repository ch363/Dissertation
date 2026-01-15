import { IsArray, IsEnum, ArrayMaxSize } from 'class-validator';
import { Transform } from 'class-transformer';
import { DELIVERY_METHOD } from '@prisma/client';
import { sanitizeEnum } from '../../common/utils/sanitize.util';

/**
 * DTO for updating delivery methods for a question
 * 
 * Security: Input validation and sanitization
 * - DeliveryMethods: Required, array of valid delivery methods, max 10 items
 */
export class UpdateDeliveryMethodsDto {
  @IsArray()
  @ArrayMaxSize(10, { message: 'Delivery methods array must not exceed 10 items' })
  @IsEnum(DELIVERY_METHOD, { each: true, message: 'Each delivery method must be a valid delivery method' })
  @Transform(({ value }) => {
    if (!Array.isArray(value)) return value;
    return value
      .map((v) => sanitizeEnum(v, Object.values(DELIVERY_METHOD)))
      .filter((v) => v !== null) as DELIVERY_METHOD[];
  })
  deliveryMethods: DELIVERY_METHOD[];
}
