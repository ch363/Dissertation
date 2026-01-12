import { IsNumber } from 'class-validator';

export class DeliveryMethodScoreDto {
  @IsNumber()
  delta: number;
}
