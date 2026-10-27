import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Admin } from './admin.entity';

@Entity('admin_profiles')
export class AdminProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'birth_day' })
  dob: string;

  @Column({ name: 'img_url' })
  imgUrl: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ name: 'office_location', nullable: true })
  officeLocation: string;

  @OneToOne(() => Admin, (admin) => admin.adminProfile)
  @JoinColumn()
  admin: Admin;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
