import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { User } from '../../users/entities/user.entity';
import { Profile } from '../../users/entities/profile.entity';
import {
  CloudinaryService,
  UploadedBuffer,
} from '../../../common/storage/cloudinary.service';
import { LoginRequestDto } from '../dto/login-request.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateMeDto } from '../dto/update-me.dto';
import { UserRepository } from '../../users/repository/user.repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class JwtAuthService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly userRepository: UserRepository,
    private readonly storage: CloudinaryService,
  ) {}

  async validateUser(dto: LoginRequestDto): Promise<User> {
    const user = await this.userRepository.findOneByEmail(
      dto.email.trim().toLowerCase(),
    );
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }
    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }

  generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  verifyToken(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      phone: user.profile?.phone ?? null,
      dob: user.profile?.dob ?? null,
      bio: user.profile?.bio ?? null,
      imgUrl: user.profile?.imgUrl ?? null,
      createdAt: user.createdAt,
    };
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const update: Partial<User> = {};
    if (dto.firstName !== undefined) update.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) update.lastName = dto.lastName.trim();
    if (Object.keys(update).length > 0) {
      await this.userRepository.update(userId, update);
    }

    if (
      dto.dob &&
      dto.dob.slice(0, 10) > new Date().toISOString().slice(0, 10)
    ) {
      throw new BadRequestException('Date of birth cannot be in the future');
    }
    const profile: Partial<Profile> = {};
    if (dto.phone !== undefined)
      profile.phone = dto.phone?.trim() || (null as any);
    if (dto.dob !== undefined)
      profile.dob = dto.dob?.slice(0, 10) || (null as any);
    if (dto.bio !== undefined) profile.bio = dto.bio?.trim() || (null as any);
    if (Object.keys(profile).length > 0) {
      await this.userRepository.saveProfile(userId, profile);
    }
    return this.getMe(userId);
  }

  async updatePhoto(userId: string, file: UploadedBuffer) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const stored = await this.storage.upload(file, `profiles/${userId}`);
    const previousUrl = user.profile?.imgUrl;
    await this.userRepository
      .saveProfile(userId, { imgUrl: stored.url })
      .catch(async (err) => {
        await this.storage.remove(stored.url);
        throw err;
      });
    await this.storage.remove(previousUrl);
    return this.getMe(userId);
  }

  async removePhoto(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.profile?.imgUrl) {
      await this.userRepository.saveProfile(userId, { imgUrl: null as any });
      await this.storage.remove(user.profile.imgUrl);
    }
    return this.getMe(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const me = await this.userRepository.findById(userId);
    if (!me) throw new NotFoundException('User not found');
    const user = await this.userRepository.findOneByEmail(me.email);
    if (!user) throw new NotFoundException('User not found');
    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestException('Current password is incorrect');
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current one',
      );
    }
    await this.userRepository.update(userId, {
      passwordHash: await bcrypt.hash(dto.newPassword, 10),
    });
  }
}
