import { Injectable } from '@nestjs/common';
import { Admin } from '../entities/admin/admin.entity';
import { CreateAdminDto } from '../dto/admin/create-admin.dto';
import { AdminProfile } from '../entities/admin/admin-profile.entity';
import { AdminResponseDto } from '../dto/admin/admin-response.dto';
import { AdminProfileResponseDto } from '../dto/admin/admin-profile-response.dto';
import { User } from '../entities/user.entity';
import { UserMapper } from './user.mapper';

@Injectable()
export class AdminMapper {
  constructor(private readonly userMapper: UserMapper) {}

  // CreateAdminDto -> Admin entity
  toEntity(dto: CreateAdminDto, user: User): Admin {
    const admin = new Admin();
    admin.user = user;
    if (dto.department) {
      admin.department = dto.department;
    }

    if (dto.adminProfile) {
      const adminProfile = new AdminProfile();
      adminProfile.dob = dto.adminProfile.dob;
      adminProfile.imgUrl = dto.adminProfile.imgUrl;
      adminProfile.bio = dto.adminProfile.bio;
      if (dto.adminProfile.officeLocation) {
        adminProfile.officeLocation = dto.adminProfile.officeLocation;
      }
      admin.adminProfile = adminProfile;
    }

    return admin;
  }

  // Admin entity -> AdminResponseDto
  toResponse(admin: Admin): AdminResponseDto {
    return {
      id: admin.id,
      department: admin.department,
      user: admin.user ? this.userMapper.toResponse(admin.user) : null,
      adminProfile: admin.adminProfile
        ? this.toProfileResponse(admin.adminProfile)
        : null,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }

  // AdminProfile entity -> AdminProfileResponseDto
  toProfileResponse(adminProfile: AdminProfile): AdminProfileResponseDto {
    return {
      id: adminProfile.id,
      dob: adminProfile.dob,
      imgUrl: adminProfile.imgUrl,
      bio: adminProfile.bio,
      officeLocation: adminProfile.officeLocation,
      createdAt: adminProfile.createdAt,
      updatedAt: adminProfile.updatedAt,
    };
  }
}
