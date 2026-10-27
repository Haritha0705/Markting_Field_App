import { Injectable } from '@nestjs/common';
import { Customer } from '../entities/customer/customer.entity';
import { CreateCustomerDto } from '../dto/customer/create-customer.dto';
import { CustomerProfile } from '../entities/customer/customer-profile.entity';
import { CustomerResponseDto } from '../dto/customer/customer-response.dto';
import { CustomerProfileResponseDto } from '../dto/customer/customer-profile-response.dto';
import { User } from '../entities/user.entity';
import { UserMapper } from './user.mapper';

@Injectable()
export class CustomerMapper {
  constructor(private readonly userMapper: UserMapper) {}

  // CreateCustomerDto -> Customer entity
  toEntity(dto: CreateCustomerDto, user: User): Customer {
    const customer = new Customer();
    customer.user = user;
    if (dto.customerType) {
      customer.customerType = dto.customerType;
    }

    if (dto.customerProfile) {
      const customerProfile = new CustomerProfile();
      customerProfile.dob = dto.customerProfile.dob;
      customerProfile.imgUrl = dto.customerProfile.imgUrl;
      customerProfile.bio = dto.customerProfile.bio;
      if (dto.customerProfile.shippingAddress) {
        customerProfile.shippingAddress = dto.customerProfile.shippingAddress;
      }
      customer.customerProfile = customerProfile;
    }

    return customer;
  }

  // Customer entity -> CustomerResponseDto
  toResponse(customer: Customer): CustomerResponseDto {
    return {
      id: customer.id,
      customerType: customer.customerType,
      user: customer.user ? this.userMapper.toResponse(customer.user) : null,
      customerProfile: customer.customerProfile
        ? this.toProfileResponse(customer.customerProfile)
        : null,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  // CustomerProfile entity -> CustomerProfileResponseDto
  toProfileResponse(
    customerProfile: CustomerProfile,
  ): CustomerProfileResponseDto {
    return {
      id: customerProfile.id,
      dob: customerProfile.dob,
      imgUrl: customerProfile.imgUrl,
      bio: customerProfile.bio,
      shippingAddress: customerProfile.shippingAddress,
      createdAt: customerProfile.createdAt,
      updatedAt: customerProfile.updatedAt,
    };
  }
}
