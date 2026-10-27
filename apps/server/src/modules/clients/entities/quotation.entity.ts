import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Nationality, QuotationStatus } from '../enums/client.enums';
import { User } from '../../users/entities/user.entity';

@Entity('quotations')
export class Quotation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_name', nullable: true })
  clientName: string;

  @Column({
    type: 'enum',
    enum: Nationality,
    default: Nationality.SINHALA,
  })
  nationality: Nationality;

  @Column({
    name: 'investment_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  investmentAmount: number;

  @Column({ name: 'property_number', nullable: true })
  propertyNumber: string;

  @Column({ name: 'property_plan_number', nullable: true })
  propertyPlanNumber: string;

  @Column({
    name: 'rate_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  ratePercentage: number;

  @Column({ name: 'period_value', type: 'int', nullable: true })
  periodValue: number;

  @Column({ name: 'period_unit', nullable: true })
  periodUnit: string;

  @Column({
    name: 'monthly_profit',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  monthlyProfit: number;

  @Column({
    name: 'total_profit',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  totalProfit: number;

  @Column({
    name: 'maturity_value',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  maturityValue: number;

  @Column({
    type: 'enum',
    enum: QuotationStatus,
    default: QuotationStatus.PENDING,
  })
  status: QuotationStatus;

  @Column({ name: 'admin_notes', nullable: true })
  adminNotes: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
