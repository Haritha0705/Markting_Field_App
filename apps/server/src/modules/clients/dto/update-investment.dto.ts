import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { PaymentType, PayoutMethod } from '../enums/client.enums';

export class UpdateInvestmentDto {
  @IsString()
  @IsOptional()
  assetCategory?: string;

  @IsString()
  @IsOptional()
  projectLocation?: string;

  @IsString()
  @IsOptional()
  packagePlotSize?: string;

  @IsString()
  @IsOptional()
  propertyNumber?: string;

  @IsString()
  @IsOptional()
  propertyPlanNumber?: string;

  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @IsEnum(PaymentType)
  @IsOptional()
  paymentType?: PaymentType;

  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @IsNumber()
  @IsOptional()
  amountPaid?: number;

  @IsDateString()
  @IsOptional()
  nextPaymentDate?: string;

  @IsNumber()
  @IsOptional()
  monthlyRent?: number;

  @IsNumber()
  @IsOptional()
  shariahCommission?: number;

  @IsString()
  @IsOptional()
  programmePeriod?: string;

  @IsEnum(PayoutMethod)
  @IsOptional()
  payoutMethod?: PayoutMethod;

  @IsString()
  @IsOptional()
  chequeNumber?: string;

  @IsDateString()
  @IsOptional()
  chequeReleaseDate?: string;

  @IsNumber()
  @IsOptional()
  chequeAmount?: number;
}
