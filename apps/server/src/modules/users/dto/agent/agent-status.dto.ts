import { IsBoolean } from 'class-validator';

export class AgentStatusDto {
  @IsBoolean()
  isActive: boolean;
}
