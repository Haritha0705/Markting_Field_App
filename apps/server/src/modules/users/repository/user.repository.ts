import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from '../entities/profile.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async create(partial: Partial<User>) {
    const user = this.repository.create(partial);
    if (user.passwordHash && !user.passwordHash.startsWith('$2')) {
      user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
    }
    return this.repository.save(user);
  }

  findAllUsers(options: any) {
    return this.repository.findAndCount({
      ...options,
      relations: { profile: true },
    });
  }

  findById(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: { profile: true },
    });
  }

  update(id: string, partial: Partial<User>) {
    return this.repository.update(id, partial);
  }

  /** Creates the user's profile row on first save. */
  async saveProfile(userId: string, partial: Partial<Profile>) {
    const profiles = this.repository.manager.getRepository(Profile);
    const existing = await profiles.findOne({
      where: { user: { id: userId } },
    });
    return profiles.save(
      existing
        ? profiles.merge(existing, partial)
        : profiles.create({ ...partial, user: { id: userId } as User }),
    );
  }

  async delete(id: string) {
    const user = await this.findById(id);
    if (user && user.profile) {
      await this.repository.manager.delete(Profile, user.profile.id);
    }
    return this.repository.delete(id);
  }

  findOneByEmail(email: string) {
    return this.repository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });
  }
}
