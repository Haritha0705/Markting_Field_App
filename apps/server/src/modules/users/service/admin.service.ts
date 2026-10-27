import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminResponseDto } from '../dto/admin/admin-response.dto';
import { PageResponseDto } from '../../../common/dto/page-response';
import { UpdateAdminProfileDto } from '../dto/admin/update-admin-profile.dto';
import { AdminRepository } from '../repository/admin/admin.repository';
import { AdminProfileRepository } from '../repository/admin/admin-profile.repository';
import { AdminMapper } from '../mappers/admin.mapper';
import { UpdateAdminDto } from '../dto/admin/update-admin.dto';
import { AdminProfileResponseDto } from '../dto/admin/admin-profile-response.dto';
import { CreateAdminDto } from '../dto/admin/create-admin.dto';
import { UserRepository } from '../repository/user.repository';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly adminProfileRepository: AdminProfileRepository,
    private readonly adminMapper: AdminMapper,
    private readonly userRepository: UserRepository,
    private readonly userMapper: UserMapper,
  ) {}

  async createAdmin(dto: CreateAdminDto): Promise<AdminResponseDto> {
    const userEntity = this.userMapper.toEntity(dto);
    const savedUser = await this.userRepository.create(userEntity);

    const admin = this.adminMapper.toEntity(dto, savedUser);
    const savedAdmin = await this.adminRepository.create(admin);
    return this.adminMapper.toResponse(savedAdmin);
  }

  async findByIdAdmin(id: string): Promise<AdminResponseDto> {
    const user = await this.findUser(id);
    return this.adminMapper.toResponse(user);
  }

  async getAllAdmin(
    pageNumber: number,
    size: number,
  ): Promise<PageResponseDto<AdminResponseDto>> {
    const [admins, totalElements] = await this.adminRepository.findAllAdmins({
      skip: pageNumber * size,
      take: size,
    });

    const userResponses = admins.map((u) => this.adminMapper.toResponse(u));
    const totalPages = Math.ceil(totalElements / size);

    return new PageResponseDto<AdminResponseDto>(
      userResponses,
      pageNumber,
      size,
      totalElements,
      totalPages,
    );
  }

  async updateAdmin(
    adminId: string,
    dto: UpdateAdminDto,
  ): Promise<AdminResponseDto> {
    const admin = await this.findUser(adminId);

    // Update User-level fields
    if (admin.user) {
      const userUpdate: any = {};
      if (dto.firstName !== undefined) userUpdate.firstName = dto.firstName;
      if (dto.lastName !== undefined) userUpdate.lastName = dto.lastName;
      if (Object.keys(userUpdate).length > 0) {
        await this.userRepository.update(admin.user.id, userUpdate);
      }
    }

    // Update Admin-level fields
    const adminUpdate: any = {};
    if (dto.department !== undefined) adminUpdate.department = dto.department;
    if (Object.keys(adminUpdate).length > 0) {
      await this.adminRepository.update(adminId, adminUpdate);
    }

    if (dto.profileUpdate && admin.adminProfile) {
      await this.adminProfileRepository.update(
        admin.adminProfile.id,
        dto.profileUpdate,
      );
    }

    const updatedAdmin = await this.findUser(adminId);
    return this.adminMapper.toResponse(updatedAdmin);
  }

  async deleteAdmin(id: string): Promise<void> {
    const admin = await this.findUser(id);
    await this.adminRepository.delete(id);
    if (admin.user) {
      await this.userRepository.delete(admin.user.id);
    }
  }

  async getAdminProfile(id: string): Promise<AdminProfileResponseDto> {
    const admin = await this.findUser(id);
    if (!admin.adminProfile) throw new NotFoundException('Profile not found');
    return this.adminMapper.toProfileResponse(admin.adminProfile);
  }

  async updateAdminProfile(
    id: string,
    dto: UpdateAdminProfileDto,
  ): Promise<AdminProfileResponseDto> {
    const user = await this.findUser(id);
    if (!user.adminProfile) throw new NotFoundException('Profile not found');

    await this.adminProfileRepository.update(user.adminProfile.id, dto);
    const updatedUser = await this.findUser(id);
    return this.adminMapper.toProfileResponse(updatedUser.adminProfile);
  }

  //helper method
  async findUser(id: string) {
    const user = await this.adminRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
