import { UserResponseDto } from '../user-response.dto';
import { AgentProfileResponseDto } from './agent-profile-response.dto';

export class AgentResponseDto {
  id: string;
  territory?: string;
  user?: UserResponseDto | null;
  agentProfile?: AgentProfileResponseDto | null;
  createdAt: Date;
  updatedAt: Date;
}
