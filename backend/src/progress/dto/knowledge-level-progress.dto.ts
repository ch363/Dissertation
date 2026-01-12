import { IsInt } from 'class-validator';

export class KnowledgeLevelProgressDto {
  @IsInt()
  value: number;
}
