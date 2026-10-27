import { Injectable } from '@nestjs/common';
import { Agent } from '../entities/agent/agent.entity';
import { CreateAgentDto } from '../dto/agent/create-agent.dto';
import { AgentProfile } from '../entities/agent/agent-profile.entity';
import { AgentResponseDto } from '../dto/agent/agent-response.dto';
import { AgentProfileResponseDto } from '../dto/agent/agent-profile-response.dto';
import { User } from '../entities/user.entity';
import { UserMapper } from './user.mapper';

@Injectable()
export class AgentMapper {
  constructor(private readonly userMapper: UserMapper) {}

  // CreateAgentDto -> Agent entity
  toEntity(dto: CreateAgentDto, user: User): Agent {
    const agent = new Agent();
    agent.user = user;
    if (dto.territory) {
      agent.territory = dto.territory;
    }

    if (dto.agentProfile) {
      const agentProfile = new AgentProfile();
      agentProfile.dob = dto.agentProfile.dob;
      agentProfile.imgUrl = dto.agentProfile.imgUrl;
      agentProfile.bio = dto.agentProfile.bio;
      if (dto.agentProfile.yearsOfExperience !== undefined) {
        agentProfile.yearsOfExperience = dto.agentProfile.yearsOfExperience;
      }
      agent.agentProfile = agentProfile;
    }

    return agent;
  }

  // Agent entity -> AgentResponseDto
  toResponse(agent: Agent): AgentResponseDto {
    return {
      id: agent.id,
      territory: agent.territory,
      user: agent.user ? this.userMapper.toResponse(agent.user) : null,
      agentProfile: agent.agentProfile
        ? this.toProfileResponse(agent.agentProfile)
        : null,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    };
  }

  // AgentProfile entity -> AgentProfileResponseDto
  toProfileResponse(agentProfile: AgentProfile): AgentProfileResponseDto {
    return {
      id: agentProfile.id,
      dob: agentProfile.dob,
      imgUrl: agentProfile.imgUrl,
      bio: agentProfile.bio,
      yearsOfExperience: agentProfile.yearsOfExperience,
      createdAt: agentProfile.createdAt,
      updatedAt: agentProfile.updatedAt,
    };
  }
}
