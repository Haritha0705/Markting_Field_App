import { UserResponseDto } from '../user-response.dto';
import { CustomerProfileResponseDto } from './customer-profile-response.dto';

export class CustomerResponseDto {
  id: string;
  customerType?: string;
  user?: UserResponseDto | null;
  customerProfile?: CustomerProfileResponseDto | null;
  createdAt: Date;
  updatedAt: Date;
}
