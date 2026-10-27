import { IsString } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  dob: string;

  @IsString()
  imgUrl: string;

  @IsString()
  bio: string;
}
