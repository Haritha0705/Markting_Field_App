import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Customer } from '../../entities/customer/customer.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomerProfile } from '../../entities/customer/customer-profile.entity';

@Injectable()
export class CustomerRepository {
  constructor(
    @InjectRepository(Customer)
    private readonly repository: Repository<Customer>,
  ) {}

  create(partial: Partial<Customer>) {
    return this.repository.save(this.repository.create(partial));
  }

  findAllCustomer(options: any) {
    return this.repository.findAndCount({
      ...options,
      relations: { user: { profile: true }, customerProfile: true },
    });
  }

  findById(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: { user: { profile: true }, customerProfile: true },
    });
  }

  update(id: string, partial: Partial<Customer>) {
    return this.repository.update(id, partial);
  }

  async delete(id: string) {
    const customer = await this.findById(id);
    if (customer && customer.customerProfile) {
      await this.repository.manager.delete(
        CustomerProfile,
        customer.customerProfile.id,
      );
    }
    return this.repository.delete(id);
  }
}
