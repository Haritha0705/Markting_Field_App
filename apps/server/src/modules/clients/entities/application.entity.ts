import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ApplicationStatus,
  ApplicationStep,
  InvestorType,
  Nationality,
} from '../enums/client.enums';
import { Branch } from './branch.entity';
import { User } from '../../users/entities/user.entity';
import { Investment } from './investment.entity';
import { BankingDetail } from './banking-detail.entity';
import { Nominee } from './nominee.entity';
import { Document } from './document.entity';
import { Payment } from './payment.entity';

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'reference_number', unique: true })
  referenceNumber: string;

  // Personal Details (Step 1)
  @Column({
    name: 'investor_type',
    type: 'enum',
    enum: InvestorType,
    default: InvestorType.INDIVIDUAL,
  })
  investorType: InvestorType;

  @Column({ name: 'joint_investor_name', nullable: true })
  jointInvestorName: string;

  @Column({ name: 'company_name', nullable: true })
  companyName: string;

  @Column({ name: 'other_investor_type', nullable: true })
  otherInvestorType: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'nic_passport' })
  nicPassport: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @Column({
    type: 'enum',
    enum: Nationality,
    default: Nationality.SINHALA,
  })
  nationality: Nationality;

  @Column({ name: 'residential_address', nullable: true })
  residentialAddress: string;

  @Column({ name: 'postal_address', nullable: true })
  postalAddress: string;

  @Column({ name: 'postal_same_as_residential', default: true })
  postalSameAsResidential: boolean;

  @Column({ name: 'mobile_number' })
  mobileNumber: string;

  @Column({ name: 'email_address', nullable: true })
  emailAddress: string;

  @Column({ nullable: true })
  occupation: string;

  // Application status tracking
  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
  })
  status: ApplicationStatus;

  @Column({
    name: 'current_step',
    type: 'enum',
    enum: ApplicationStep,
    default: ApplicationStep.PERSONAL,
  })
  currentStep: ApplicationStep;

  @Column({ name: 'declaration_accepted', default: false })
  declarationAccepted: boolean;

  @Column({ name: 'phone_verified', default: false })
  phoneVerified: boolean;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  // Phone OTP (hash only; never returned by default selects)
  @Column({ name: 'otp_hash', type: 'varchar', nullable: true, select: false })
  otpHash: string | null;

  @Column({
    name: 'otp_expires_at',
    type: 'timestamp',
    nullable: true,
    select: false,
  })
  otpExpiresAt: Date | null;

  @Column({ name: 'otp_attempts', type: 'int', default: 0, select: false })
  otpAttempts: number;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'rejection_reason', nullable: true })
  rejectionReason: string;

  // Relations
  @ManyToOne(() => Branch, (branch) => branch.applications, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'officer_id' })
  officer: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User;

  @OneToOne(() => Investment, (inv) => inv.application, { cascade: true })
  investment: Investment;

  @OneToOne(() => BankingDetail, (bd) => bd.application, { cascade: true })
  bankingDetail: BankingDetail;

  @OneToMany(() => Nominee, (n) => n.application, { cascade: true })
  nominees: Nominee[];

  @OneToMany(() => Document, (d) => d.application, { cascade: true })
  documents: Document[];

  @OneToMany(() => Payment, (p) => p.application, { cascade: true })
  payments: Payment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
