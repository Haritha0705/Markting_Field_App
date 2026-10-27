import { IsOptional, IsString } from 'class-validator';

export class CreateAdminProfileDto {
  @IsString()
  dob: string;

  @IsString()
  imgUrl: string;

  @IsString()
  bio: string;

  @IsOptional()
  @IsString()
  officeLocation?: string;
}
