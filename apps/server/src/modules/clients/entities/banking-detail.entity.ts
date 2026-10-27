import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Application } from './application.entity';

@Entity('banking_details')
export class BankingDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bank_name', nullable: true })
  bankName: string;

  @Column({ name: 'branch_name', nullable: true })
  branchName: string;

  @Column({ name: 'account_holder_name', nullable: true })
  accountHolderName: string;

  @Column({ name: 'account_number', nullable: true })
  accountNumber: string;

  @OneToOne(() => Application, (app) => app.bankingDetail)
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
