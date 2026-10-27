import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { API_ROUTES } from '../../../common/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../enums/users-type.enum';
import { AdminService } from '../service/admin.service';
import { CreateAdminDto } from '../dto/admin/create-admin.dto';
import { UpdateAdminProfileDto } from '../dto/admin/update-admin-profile.dto';
import { UpdateAdminDto } from '../dto/admin/update-admin.dto';

@Roles(Role.SuperAdmin)
@Controller(API_ROUTES.ADMINS)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.createAdmin(createAdminDto);
  }

  @Get()
  getAll(
    @Query('pageNumber') pageNumber: number = 0,
    @Query('size') size: number = 10,
  ) {
    return this.adminService.getAllAdmin(pageNumber, size);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.findByIdAdmin(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    return this.adminService.updateAdmin(id, updateAdminDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteAdmin(id);
  }

  @Get(':id/profile')
  getUserProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getAdminProfile(id);
  }

  @Patch(':id/profile')
  updateUserProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProfileDto: UpdateAdminProfileDto,
  ) {
    return this.adminService.updateAdminProfile(id, updateProfileDto);
  }
}
