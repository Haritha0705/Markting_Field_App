import { IsOptional, IsString } from 'class-validator';

export class ProfileUpdateDto {
  @IsOptional()
  @IsString()
  dob?: string;

  @IsOptional()
  @IsString()
  imgUrl?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
