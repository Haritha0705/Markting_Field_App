import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Agent } from '../../entities/agent/agent.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AgentProfile } from '../../entities/agent/agent-profile.entity';

@Injectable()
export class AgentRepository {
  constructor(
    @InjectRepository(Agent)
    private readonly repository: Repository<Agent>,
  ) {}

  create(partial: Partial<Agent>) {
    return this.repository.save(this.repository.create(partial));
  }

  findAllAgents(options: any) {
    return this.repository.findAndCount({
      ...options,
      relations: { user: { profile: true }, agentProfile: true },
    });
  }

  findById(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: { user: { profile: true }, agentProfile: true },
    });
  }

  update(id: string, partial: Partial<Agent>) {
    return this.repository.update(id, partial);
  }

  async delete(id: string) {
    const agent = await this.findById(id);
    if (agent && agent.agentProfile) {
      await this.repository.manager.delete(AgentProfile, agent.agentProfile.id);
    }
    return this.repository.delete(id);
  }
}
