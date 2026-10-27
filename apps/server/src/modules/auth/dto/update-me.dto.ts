import {
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  // null clears the field
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9 ]{7,20}$/, { message: 'Enter a valid phone number' })
  phone?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'Enter a valid date of birth' })
  dob?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  bio?: string | null;
}
