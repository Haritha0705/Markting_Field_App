import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAdminProfileDto } from './create-admin-profile.dto';
import { CreateUserDto } from '../create-user.dto';

export class CreateAdminDto extends CreateUserDto {
  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAdminProfileDto)
  adminProfile?: CreateAdminProfileDto;
}
