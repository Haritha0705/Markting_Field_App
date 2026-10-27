import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserUpdateDto } from '../user-update.dto';
import { UpdateAgentProfileDto } from './update-agent-profile.dto';

export class UpdateAgentDto extends UserUpdateDto {
  @IsOptional()
  @IsEmail({}, { message: 'Enter a valid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  territory?: string;

  // null clears the field; stored on the same profile the officer edits
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

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAgentProfileDto)
  profileUpdate?: UpdateAgentProfileDto;
}
