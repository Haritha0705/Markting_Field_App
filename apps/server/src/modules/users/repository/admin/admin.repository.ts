import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Admin } from '../../entities/admin/admin.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminProfile } from '../../entities/admin/admin-profile.entity';

@Injectable()
export class AdminRepository {
  constructor(
    @InjectRepository(Admin)
    private readonly repository: Repository<Admin>,
  ) {}

  create(partial: Partial<Admin>) {
    return this.repository.save(this.repository.create(partial));
  }

  findAllAdmins(options: any) {
    return this.repository.findAndCount({
      ...options,
      relations: { user: { profile: true }, adminProfile: true },
    });
  }

  findById(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: { user: { profile: true }, adminProfile: true },
    });
  }

  update(id: string, partial: Partial<Admin>) {
    return this.repository.update(id, partial);
  }

  async delete(id: string) {
    const admin = await this.findById(id);
    if (admin && admin.adminProfile) {
      await this.repository.manager.delete(AdminProfile, admin.adminProfile.id);
    }
    return this.repository.delete(id);
  }
}
