import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { Profile } from '../entities/profile.entity';
import { UserResponseDto } from '../dto/user-response.dto';
import { ProfileResponseDto } from '../dto/profile-response.dto';

@Injectable()
export class UserMapper {
  // CreateUserDto -> User entity
  toEntity(dto: CreateUserDto): User {
    const user = new User();
    user.email = dto.email.trim().toLowerCase();
    user.passwordHash = dto.passwordHash;
    user.firstName = dto.firstName;
    user.lastName = dto.lastName;
    user.role = dto.role;
    user.isActive = dto.isActive;

    if (dto.profile) {
      const profile = new Profile();
      profile.dob = dto.profile.dob;
      profile.imgUrl = dto.profile.imgUrl;
      profile.bio = dto.profile.bio;
      user.profile = profile;
    }

    return user;
  }

  // User entity -> LoginResponseDto
  toResponse(user: User): UserResponseDto {
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
