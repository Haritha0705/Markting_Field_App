import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './controllers/admin.controller';
import { AgentController } from './controllers/agent.controller';
import { CustomerController } from './controllers/customer.controller';
import { Admin } from './entities/admin/admin.entity';
import { AdminProfile } from './entities/admin/admin-profile.entity';
import { Agent } from './entities/agent/agent.entity';
import { AgentProfile } from './entities/agent/agent-profile.entity';
import { Customer } from './entities/customer/customer.entity';
import { CustomerProfile } from './entities/customer/customer-profile.entity';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { AdminService } from './service/admin.service';
import { AgentService } from './service/agent.service';
import { CustomerService } from './service/customer.service';
import { AdminRepository } from './repository/admin/admin.repository';
import { AdminProfileRepository } from './repository/admin/admin-profile.repository';
import { AgentRepository } from './repository/agent/agent.repository';
import { AgentProfileRepository } from './repository/agent/agent-profile.repository';
import { CustomerRepository } from './repository/customer/customer.repository';
import { CustomerProfileRepository } from './repository/customer/customer-profile.repository';
import { UserRepository } from './repository/user.repository';
import { AdminMapper } from './mappers/admin.mapper';
import { AgentMapper } from './mappers/agent.mapper';
import { CustomerMapper } from './mappers/customer.mapper';
import { UserMapper } from './mappers/user.mapper';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Admin,
      AdminProfile,
      Agent,
      AgentProfile,
      Customer,
      CustomerProfile,
      User,
      Profile,
    ]),
  ],
  controllers: [AdminController, AgentController, CustomerController],
  providers: [
    AdminService,
    AdminRepository,
    AdminProfileRepository,
    AdminMapper,
    AgentService,
    AgentRepository,
    AgentProfileRepository,
    AgentMapper,
    CustomerService,
    CustomerRepository,
    CustomerProfileRepository,
    CustomerMapper,
    UserRepository,
    UserMapper,
  ],
  exports: [TypeOrmModule, UserRepository],
})
export class UserModule {}
