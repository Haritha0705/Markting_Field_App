import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAgentProfileDto {
  @IsString()
  dob: string;

  @IsString()
  imgUrl: string;

  @IsString()
  bio: string;

  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;
}
