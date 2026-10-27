import { Injectable, NotFoundException } from '@nestjs/common';
import { PageResponseDto } from '../../../common/dto/page-response';
import { CustomerProfileResponseDto } from '../dto/customer/customer-profile-response.dto';
import { UpdateCustomerProfileDto } from '../dto/customer/update-customer-profile.dto';
import { CustomerMapper } from '../mappers/customer.mapper';
import { CustomerProfileRepository } from '../repository/customer/customer-profile.repository';
import { CustomerRepository } from '../repository/customer/customer.repository';
import { CreateCustomerDto } from '../dto/customer/create-customer.dto';
import { CustomerResponseDto } from '../dto/customer/customer-response.dto';
import { UpdateCustomerDto } from '../dto/customer/update.customer.dto';
import { UserRepository } from '../repository/user.repository';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class CustomerService {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly customerprofileRepository: CustomerProfileRepository,
    private readonly customerMapper: CustomerMapper,
    private readonly userRepository: UserRepository,
    private readonly userMapper: UserMapper,
  ) {}

  //get all customer by register agent
  //get custermer status As Completed or Pending.
  // Look his Overview
  // Look his Comision
  // calcel cuter
  // pending cuter
  // approve cuter

  async createCustomer(dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    const userEntity = this.userMapper.toEntity(dto);
    const savedUser = await this.userRepository.create(userEntity);

    const customer = this.customerMapper.toEntity(dto, savedUser);
    const savedCustomer = await this.customerRepository.create(customer);
    return this.customerMapper.toResponse(savedCustomer);
  }

  async findByIdCustomer(id: string): Promise<CustomerResponseDto> {
    const customer = await this.findUser(id);
    return this.customerMapper.toResponse(customer);
  }

  async getAllCustomer(
    pageNumber: number,
    size: number,
  ): Promise<PageResponseDto<CustomerResponseDto>> {
    const [admins, totalElements] =
      await this.customerRepository.findAllCustomer({
        skip: pageNumber * size,
        take: size,
      });

    const userResponses = admins.map((u) => this.customerMapper.toResponse(u));
    const totalPages = Math.ceil(totalElements / size);

    return new PageResponseDto<CustomerResponseDto>(
      userResponses,
      pageNumber,
      size,
      totalElements,
      totalPages,
    );
  }

  async updateCustomer(
    customerId: string,
    dto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.findUser(customerId);

    // Update User-level fields
    if (customer.user) {
      const userUpdate: any = {};
      if (dto.firstName !== undefined) userUpdate.firstName = dto.firstName;
      if (dto.lastName !== undefined) userUpdate.lastName = dto.lastName;
      if (Object.keys(userUpdate).length > 0) {
        await this.userRepository.update(customer.user.id, userUpdate);
      }
    }

    // Update Customer-level fields
    const customerUpdate: any = {};
    if (dto.customerType !== undefined)
      customerUpdate.customerType = dto.customerType;
    if (Object.keys(customerUpdate).length > 0) {
      await this.customerRepository.update(customerId, customerUpdate);
    }

    if (dto.profileUpdate && customer.customerProfile) {
      await this.customerprofileRepository.update(
        customer.customerProfile.id,
        dto.profileUpdate,
      );
    }

    const updatedCustomer = await this.findUser(customerId);
    return this.customerMapper.toResponse(updatedCustomer);
  }

  async deleteCustomer(id: string): Promise<void> {
    const customer = await this.findUser(id);
    await this.customerRepository.delete(id);
    if (customer.user) {
      await this.userRepository.delete(customer.user.id);
    }
  }

  async getCustomerProfile(id: string): Promise<CustomerProfileResponseDto> {
    const customer = await this.findUser(id);
    if (!customer.customerProfile)
      throw new NotFoundException('Profile not found');
    return this.customerMapper.toProfileResponse(customer.customerProfile);
  }

  async updateCustomerProfile(
    id: string,
    dto: UpdateCustomerProfileDto,
  ): Promise<CustomerProfileResponseDto> {
    const customer = await this.findUser(id);
    if (!customer.customerProfile)
      throw new NotFoundException('Profile not found');

    await this.customerprofileRepository.update(
      customer.customerProfile.id,
      dto,
    );
    const updatedCustomer = await this.findUser(id);
    return this.customerMapper.toProfileResponse(
      updatedCustomer.customerProfile,
    );
  }

  //helper method
  async findUser(id: string) {
    const user = await this.customerRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
