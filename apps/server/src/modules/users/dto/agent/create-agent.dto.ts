import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAgentProfileDto } from './create-agent-profile.dto';
import { CreateUserDto } from '../create-user.dto';

export class CreateAgentDto extends CreateUserDto {
  @IsOptional()
  @IsString()
  territory?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAgentProfileDto)
  agentProfile?: CreateAgentProfileDto;
}
