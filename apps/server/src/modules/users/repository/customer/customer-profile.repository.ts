import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomerProfile } from '../../entities/customer/customer-profile.entity';

@Injectable()
export class CustomerProfileRepository {
  constructor(
    @InjectRepository(CustomerProfile)
    private readonly repository: Repository<CustomerProfile>,
  ) {}

  findByUserProfileByUserId(id: string): Promise<CustomerProfile | null> {
    return this.repository
      .createQueryBuilder('customers')
      .leftJoinAndSelect('customers.profiles', 'profiles')
      .where('customers.id', { id })
      .getOne();
  }

  update(id: string, partial: Partial<CustomerProfile>) {
    return this.repository.update(id, partial);
  }
}
