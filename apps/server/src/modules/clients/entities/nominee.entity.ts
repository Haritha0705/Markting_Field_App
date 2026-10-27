import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Application } from './application.entity';

@Entity('nominees')
export class Nominee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nominee_number', type: 'int' })
  nomineeNumber: number;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ nullable: true })
  relationship: string;

  @Column({ name: 'nic_passport', nullable: true })
  nicPassport: string;

  @Column({ name: 'mobile_number', nullable: true })
  mobileNumber: string;

  @Column({ nullable: true })
  address: string;

  @Column({
    name: 'profit_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  profitPercentage: number;

  @Column({ name: 'transfer_reason', nullable: true })
  transferReason: string;

  @ManyToOne(() => Application, (app) => app.nominees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
