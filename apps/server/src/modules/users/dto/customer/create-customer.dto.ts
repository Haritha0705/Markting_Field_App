import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCustomerProfileDto } from './create-customer-profile.dto';
import { CreateUserDto } from '../create-user.dto';

export class CreateCustomerDto extends CreateUserDto {
  @IsOptional()
  @IsString()
  customerType?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCustomerProfileDto)
  customerProfile?: CreateCustomerProfileDto;
}
