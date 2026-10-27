import { IsOptional, IsString } from 'class-validator';

export class UpdateBankingDto {
  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  branchName?: string;

  @IsString()
  @IsOptional()
  accountHolderName?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;
}
