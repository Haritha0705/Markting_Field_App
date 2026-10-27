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
import { CustomerService } from '../service/customer.service';
import { CreateCustomerDto } from '../dto/customer/create-customer.dto';
import { UpdateCustomerDto } from '../dto/customer/update.customer.dto';
import { UpdateCustomerProfileDto } from '../dto/customer/update-customer-profile.dto';

@Roles(Role.SuperAdmin, Role.Admin)
@Controller(API_ROUTES.CUSTOMERS)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.createCustomer(createCustomerDto);
  }

  @Get()
  getAll(
    @Query('pageNumber') pageNumber: number = 0,
    @Query('size') size: number = 10,
  ) {
    return this.customerService.getAllCustomer(pageNumber, size);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.findByIdCustomer(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customerService.updateCustomer(id, updateCustomerDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.deleteCustomer(id);
  }

  @Get(':id/profile')
  getUserProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.getCustomerProfile(id);
  }

  @Patch(':id/profile')
  updateUserProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProfileDto: UpdateCustomerProfileDto,
  ) {
    return this.customerService.updateCustomerProfile(id, updateProfileDto);
  }
}
