import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserUpdateDto } from '../user-update.dto';
import { UpdateCustomerProfileDto } from './update-customer-profile.dto';

export class UpdateCustomerDto extends UserUpdateDto {
  @IsOptional()
  @IsString()
  customerType?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCustomerProfileDto)
  profileUpdate?: UpdateCustomerProfileDto;
}
