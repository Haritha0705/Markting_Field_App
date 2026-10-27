import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserUpdateDto } from '../user-update.dto';
import { UpdateAdminProfileDto } from './update-admin-profile.dto';

export class UpdateAdminDto extends UserUpdateDto {
  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAdminProfileDto)
  profileUpdate?: UpdateAdminProfileDto;
}
