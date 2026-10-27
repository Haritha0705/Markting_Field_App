import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AgentProfile } from '../../entities/agent/agent-profile.entity';

@Injectable()
export class AgentProfileRepository {
  constructor(
    @InjectRepository(AgentProfile)
    private readonly repository: Repository<AgentProfile>,
  ) {}

  findByUserProfileByUserId(id: string): Promise<AgentProfile | null> {
    return this.repository
      .createQueryBuilder('agents')
      .leftJoinAndSelect('agents.profiles', 'profiles')
      .where('agents.id', { id })
      .getOne();
  }

  update(id: string, partial: Partial<AgentProfile>) {
    return this.repository.update(id, partial);
  }
}
