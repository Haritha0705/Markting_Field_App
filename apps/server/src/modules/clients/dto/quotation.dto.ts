import {
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Nationality } from '../enums/client.enums';

export class CreateQuotationDto {
  @IsString()
  @IsOptional()
  clientName?: string;

  @IsEnum(Nationality)
  @IsOptional()
  nationality?: Nationality;

  @IsNumber()
  @IsPositive({ message: 'Investment amount must be greater than 0' })
  investmentAmount: number;

  @IsString()
  @IsOptional()
  propertyNumber?: string;

  @IsString()
  @IsOptional()
  propertyPlanNumber?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  periodValue?: number;

  @IsIn(['months', 'years'])
  @IsOptional()
  periodUnit?: string;
}

export class ApproveQuotationDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  ratePercentage: number;

  @IsString()
  @IsOptional()
  adminNotes?: string;
}

export class RejectQuotationDto {
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
