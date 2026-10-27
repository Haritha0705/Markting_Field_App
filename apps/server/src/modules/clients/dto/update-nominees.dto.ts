import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class NomineeDto {
  @IsNumber()
  nomineeNumber: number;

  @IsString()
  fullName: string;

  @IsString()
  @IsOptional()
  relationship?: string;

  @IsString()
  @IsOptional()
  nicPassport?: string;

  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  profitPercentage?: number;

  @IsString()
  @IsOptional()
  transferReason?: string;
}

export class UpdateNomineesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NomineeDto)
  nominees: NomineeDto[];
}
