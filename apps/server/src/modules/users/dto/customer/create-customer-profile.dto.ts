import { IsOptional, IsString } from 'class-validator';

export class CreateCustomerProfileDto {
  @IsString()
  dob: string;

  @IsString()
  imgUrl: string;

  @IsString()
  bio: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;
}
