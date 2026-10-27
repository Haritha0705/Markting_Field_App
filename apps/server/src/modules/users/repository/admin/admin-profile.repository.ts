import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminProfile } from '../../entities/admin/admin-profile.entity';

@Injectable()
export class AdminProfileRepository {
  constructor(
    @InjectRepository(AdminProfile)
    private readonly repository: Repository<AdminProfile>,
  ) {}

  findByAdminProfileByAdminId(id: string): Promise<AdminProfile | null> {
    return this.repository
      .createQueryBuilder('admins')
      .leftJoinAndSelect('admins.profiles', 'profiles')
      .where('admins.id', { id })
      .getOne();
  }

  update(id: string, partial: Partial<AdminProfile>) {
    return this.repository.update(id, partial);
  }
}
