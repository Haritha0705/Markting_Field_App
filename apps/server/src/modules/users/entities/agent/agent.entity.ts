import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AgentProfile } from './agent-profile.entity';
import { User } from '../user.entity';

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  territory: string;

  // Many agents can belong to the users table (N:1)
  @ManyToOne(() => User, (user) => user.agents)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 1:1 → AgentProfile
  @OneToOne(() => AgentProfile, (profile) => profile.agent, { cascade: true })
  agentProfile: AgentProfile;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
