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
import { CustomerProfile } from './customer-profile.entity';
import { User } from '../user.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_type', nullable: true })
  customerType: string;

  // Many customers can belong to the users table (N:1)
  @ManyToOne(() => User, (user) => user.customers)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 1:1 → CustomerProfile
  @OneToOne(() => CustomerProfile, (profile) => profile.customer, {
    cascade: true,
  })
  customerProfile: CustomerProfile;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
