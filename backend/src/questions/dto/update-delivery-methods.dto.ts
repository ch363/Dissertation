import { IsArray, IsEnum } from 'class-validator';
import { DELIVERY_METHOD } from '@prisma/client';

export class UpdateDeliveryMethodsDto {
  @IsArray()
  @IsEnum(DELIVERY_METHOD, { each: true })
  deliveryMethods: DELIVERY_METHOD[];
}
