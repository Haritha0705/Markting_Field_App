import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('customer_profiles')
export class CustomerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'birth_day' })
  dob: string;

  @Column({ name: 'img_url' })
  imgUrl: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ name: 'shipping_address', nullable: true })
  shippingAddress: string;

  @OneToOne(() => Customer, (customer) => customer.customerProfile)
  @JoinColumn()
  customer: Customer;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
