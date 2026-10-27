import { Injectable } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { Profile } from '../../users/entities/profile.entity';
import { Role } from '../../users/enums/users-type.enum';

export interface LoginResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  profile: ProfileResponseDto | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileResponseDto {
  id: string;
  dob?: string;
  imgUrl?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AuthMapper {
  // User entity -> LoginResponseDto
  toResponse(user: User): LoginResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      profile: user.profile ? this.toProfileResponse(user.profile) : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // Profile entity -> ProfileResponseDto
  toProfileResponse(profile: Profile): ProfileResponseDto {
    return {
      id: profile.id,
      dob: profile.dob,
      imgUrl: profile.imgUrl,
      bio: profile.bio,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
