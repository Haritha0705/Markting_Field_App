import { IsNotEmpty, IsString } from 'class-validator';

export class RejectApplicationDto {
  @IsString()
  @IsNotEmpty({ message: 'A rejection reason is required' })
  reason: string;
}
