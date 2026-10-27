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
import { AdminProfile } from './admin-profile.entity';
import { User } from '../user.entity';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  department: string;

  // Many admins can belong to the users table (N:1)
  @ManyToOne(() => User, (user) => user.admins)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 1:1 → AdminProfile
  @OneToOne(() => AdminProfile, (profile) => profile.admin, { cascade: true })
  adminProfile: AdminProfile;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
