import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentType, PayoutMethod } from '../enums/client.enums';
import { Application } from './application.entity';

@Entity('investments')
export class Investment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'asset_category', nullable: true })
  assetCategory: string;

  @Column({ name: 'project_location', nullable: true })
  projectLocation: string;

  @Column({ name: 'package_plot_size', nullable: true })
  packagePlotSize: string;

  @Column({ name: 'property_number', nullable: true })
  propertyNumber: string;

  @Column({ name: 'property_plan_number', nullable: true })
  propertyPlanNumber: string;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @Column({
    name: 'payment_type',
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.FULL,
  })
  paymentType: PaymentType;

  @Column({ name: 'payment_date', type: 'date', nullable: true })
  paymentDate: Date | null;

  @Column({
    name: 'amount_paid',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  amountPaid: number;

  @Column({
    name: 'balance_remaining',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  balanceRemaining: number;

  @Column({ name: 'next_payment_date', type: 'date', nullable: true })
  nextPaymentDate: Date | null;

  @Column({
    name: 'monthly_rent',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  monthlyRent: number;

  @Column({
    name: 'shariah_commission',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  shariahCommission: number;

  @Column({ name: 'programme_period', nullable: true })
  programmePeriod: string;

  @Column({
    name: 'payout_method',
    type: 'enum',
    enum: PayoutMethod,
    default: PayoutMethod.BANK_TRANSFER,
  })
  payoutMethod: PayoutMethod;

  @Column({ name: 'cheque_number', nullable: true })
  chequeNumber: string;

  @Column({ name: 'cheque_release_date', type: 'date', nullable: true })
  chequeReleaseDate: Date | null;

  @Column({
    name: 'cheque_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  chequeAmount: number;

  @OneToOne(() => Application, (app) => app.investment)
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
