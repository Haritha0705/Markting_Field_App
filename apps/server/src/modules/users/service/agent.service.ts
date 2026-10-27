import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Agent } from '../entities/agent/agent.entity';
import { Profile } from '../entities/profile.entity';
import { Role } from '../enums/users-type.enum';
import { Application } from '../../clients/entities/application.entity';
import { PageResponseDto } from '../../../common/dto/page-response';
import { UpdateAgentDto } from '../dto/agent/update-agent.dto';
import { AgentMapper } from '../mappers/agent.mapper';
import { AgentResponseDto } from '../dto/agent/agent-response.dto';
import { CreateAgentDto } from '../dto/agent/create-agent.dto';
import { AgentRepository } from '../repository/agent/agent.repository';
import { AgentProfileResponseDto } from '../dto/agent/agent-profile-response.dto';
import { UpdateAgentProfileDto } from '../dto/agent/update-agent-profile.dto';
import { AgentProfileRepository } from '../repository/agent/agent-profile.repository';
import { UserRepository } from '../repository/user.repository';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class AgentService {
  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly agentProfileRepository: AgentProfileRepository,
    private readonly agentMapper: AgentMapper,
    private readonly userRepository: UserRepository,
    private readonly userMapper: UserMapper,
    @InjectRepository(Agent)
    private readonly agentRepo: Repository<Agent>,
  ) {}

  async createAgent(dto: CreateAgentDto): Promise<AgentResponseDto> {
    const email = dto.email.trim().toLowerCase();
    if (await this.userRepository.findOneByEmail(email)) {
      throw new ConflictException('A user with this email already exists');
    }
    // Officers created here are always agents, whatever the body says
    const userEntity = this.userMapper.toEntity({
      ...dto,
      email,
      role: Role.AGENT,
      isActive: dto.isActive ?? true,
    });
    const savedUser = await this.userRepository.create(userEntity);

    const agent = this.agentMapper.toEntity(dto, savedUser);
    const savedAgent = await this.agentRepository.create(agent);
    return this.agentMapper.toResponse(savedAgent);
  }

  async findByIdAgent(id: string): Promise<AgentResponseDto> {
    const agent = await this.findUser(id);
    return this.agentMapper.toResponse(agent);
  }

  async getAllAgents(
    pageNumber: number,
    size: number,
  ): Promise<PageResponseDto<AgentResponseDto>> {
    const [agents, totalElements] = await this.agentRepository.findAllAgents({
      skip: pageNumber * size,
      take: size,
    });

    const agentResponses = agents.map((u) => this.agentMapper.toResponse(u));
    const totalPages = Math.ceil(totalElements / size);

    return new PageResponseDto<AgentResponseDto>(
      agentResponses,
      pageNumber,
      size,
      totalElements,
      totalPages,
    );
  }

  async updateAgent(
    agentId: string,
    dto: UpdateAgentDto,
  ): Promise<AgentResponseDto> {
    const agent = await this.findUser(agentId);

    // Update User-level fields
    if (agent.user) {
      const userUpdate: any = {};
      if (dto.firstName !== undefined) {
        if (!dto.firstName.trim())
          throw new BadRequestException('First name is required');
        userUpdate.firstName = dto.firstName.trim();
      }
      if (dto.lastName !== undefined) {
        if (!dto.lastName.trim())
          throw new BadRequestException('Last name is required');
        userUpdate.lastName = dto.lastName.trim();
      }
      if (dto.email !== undefined) {
        const email = dto.email.trim().toLowerCase();
        if (email !== agent.user.email) {
          if (await this.userRepository.findOneByEmail(email)) {
            throw new ConflictException('A user with this email already exists');
          }
          userUpdate.email = email;
        }
      }
      if (Object.keys(userUpdate).length > 0) {
        await this.userRepository.update(agent.user.id, userUpdate);
      }

      // Same profile row the officer edits from the app (PATCH /auth/me)
      if (
        dto.dob &&
        dto.dob.slice(0, 10) > new Date().toISOString().slice(0, 10)
      ) {
        throw new BadRequestException('Date of birth cannot be in the future');
      }
      const profile: Partial<Profile> = {};
      if (dto.phone !== undefined)
        profile.phone = dto.phone?.trim() || (null as any);
      if (dto.dob !== undefined)
        profile.dob = dto.dob?.slice(0, 10) || (null as any);
      if (dto.bio !== undefined) profile.bio = dto.bio?.trim() || (null as any);
      if (Object.keys(profile).length > 0) {
        await this.userRepository.saveProfile(agent.user.id, profile);
      }
    }

    // Update Agent-level fields
    const agentUpdate: any = {};
    if (dto.territory !== undefined) agentUpdate.territory = dto.territory;
    if (Object.keys(agentUpdate).length > 0) {
      await this.agentRepository.update(agentId, agentUpdate);
    }

    if (dto.profileUpdate && agent.agentProfile) {
      await this.agentProfileRepository.update(
        agent.agentProfile.id,
        dto.profileUpdate,
      );
    }

    const updatedAgent = await this.findUser(agentId);
    return this.agentMapper.toResponse(updatedAgent);
  }

  async deleteAgent(id: string): Promise<void> {
    const agent = await this.findUser(id);
    await this.agentRepository.delete(id);
    if (agent.user) {
      await this.userRepository.delete(agent.user.id);
    }
  }

  async getAgentProfile(id: string): Promise<AgentProfileResponseDto> {
    const agent = await this.findUser(id);
    if (!agent.agentProfile) throw new NotFoundException('Profile not found');
    return this.agentMapper.toProfileResponse(agent.agentProfile);
  }

  async updateAgentProfile(
    id: string,
    dto: UpdateAgentProfileDto,
  ): Promise<AgentProfileResponseDto> {
    const agent = await this.findUser(id);
    if (!agent.agentProfile) throw new NotFoundException('Profile not found');

    await this.agentProfileRepository.update(agent.agentProfile.id, dto);
    const updatedAgent = await this.findUser(id);
    return this.agentMapper.toProfileResponse(updatedAgent.agentProfile);
  }

  /** Officers with their application counts, for the admin portal. */
  async getOverview(search?: string) {
    const term = search?.trim();
    const agents = await this.agentRepo.find({
      where: term
        ? [
            { user: { firstName: ILike(`%${term}%`) } },
            { user: { lastName: ILike(`%${term}%`) } },
            { user: { email: ILike(`%${term}%`) } },
            { territory: ILike(`%${term}%`) },
          ]
        : {},
      relations: { user: { profile: true } },
      order: { createdAt: 'DESC' },
    });

    const rows = await this.agentRepo.manager
      .createQueryBuilder(Application, 'app')
      .select('app.officer_id', 'officerId')
      .addSelect('COUNT(*)', 'total')
      .addSelect(`COUNT(*) FILTER (WHERE app.status = 'approved')`, 'verified')
      .addSelect(
        `COUNT(*) FILTER (WHERE app.status IN ('submitted','pending_approval'))`,
        'pending',
      )
      .addSelect(`COUNT(*) FILTER (WHERE app.status = 'draft')`, 'drafts')
      .groupBy('app.officer_id')
      .getRawMany<{
        officerId: string;
        total: string;
        verified: string;
        pending: string;
        drafts: string;
      }>();
    const byOfficer = new Map(rows.map((r) => [r.officerId, r]));

    return agents
      .filter((a) => a.user)
      .map((a) => {
        const r = byOfficer.get(a.user.id);
        return {
          id: a.id,
          userId: a.user.id,
          firstName: a.user.firstName,
          lastName: a.user.lastName,
          email: a.user.email,
          territory: a.territory,
          phone: a.user.profile?.phone ?? null,
          dob: a.user.profile?.dob ?? null,
          bio: a.user.profile?.bio ?? null,
          imgUrl: a.user.profile?.imgUrl ?? null,
          isActive: a.user.isActive,
          createdAt: a.createdAt,
          stats: {
            total: Number(r?.total ?? 0),
            verified: Number(r?.verified ?? 0),
            pending: Number(r?.pending ?? 0),
            drafts: Number(r?.drafts ?? 0),
          },
        };
      });
  }

  async setStatus(id: string, isActive: boolean): Promise<AgentResponseDto> {
    const agent = await this.findUser(id);
    await this.userRepository.update(agent.user.id, { isActive });
    return this.agentMapper.toResponse(await this.findUser(id));
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const agent = await this.findUser(id);
    await this.userRepository.update(agent.user.id, {
      passwordHash: await bcrypt.hash(newPassword, 10),
    });
  }

  //helper method
  async findUser(id: string) {
    const user = await this.agentRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
