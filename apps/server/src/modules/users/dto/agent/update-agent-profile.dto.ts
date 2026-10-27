import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAgentProfileDto {
  @IsOptional()
  @IsString()
  dob?: string;

  @IsOptional()
  @IsString()
  imgUrl?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;
}
