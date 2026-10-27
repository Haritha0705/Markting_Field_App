import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsUUID,
  Matches,
  ValidateIf,
} from 'class-validator';
import { InvestorType, Nationality } from '../enums/client.enums';

export class CreateApplicationDto {
  @IsEnum(InvestorType)
  @IsOptional()
  investorType?: InvestorType;

  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'NIC / Passport is required' })
  nicPassport: string;

  @IsString()
  @Matches(/^\+?[0-9 ]{9,15}$/, { message: 'Enter a valid mobile number' })
  mobileNumber: string;

  @IsString()
  @IsOptional()
  jointInvestorName?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  otherInvestorType?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsEnum(Nationality)
  @IsOptional()
  nationality?: Nationality;

  @IsString()
  @IsOptional()
  residentialAddress?: string;

  @IsString()
  @IsOptional()
  postalAddress?: string;

  @IsBoolean()
  @IsOptional()
  postalSameAsResidential?: boolean;

  @ValidateIf((o) => !!o.emailAddress)
  @IsEmail({}, { message: 'Enter a valid email address' })
  @IsOptional()
  emailAddress?: string;

  @IsString()
  @IsOptional()
  occupation?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;
}
