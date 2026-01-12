import { IsUUID } from 'class-validator';

export class CreateQuestionDto {
  @IsUUID()
  teachingId: string;
}
