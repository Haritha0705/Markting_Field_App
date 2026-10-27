import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../enums/users-type.enum';
import { Profile } from './profile.entity';
import { Admin } from './admin/admin.entity';
import { Agent } from './agent/agent.entity';
import { Customer } from './customer/customer.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'email', unique: true })
  email: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Index()
  @Column({ type: 'enum', enum: Role })
  role: Role;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // 1:1 → Profile
  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  profile: Profile;

  // 1:N → Admins
  @OneToMany(() => Admin, (admin) => admin.user)
  admins: Admin[];

  // 1:N → Agents
  @OneToMany(() => Agent, (agent) => agent.user)
  agents: Agent[];

  // 1:N → Customers
  @OneToMany(() => Customer, (customer) => customer.user)
  customers: Customer[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
