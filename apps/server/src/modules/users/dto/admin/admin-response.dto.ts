import { UserResponseDto } from '../user-response.dto';
import { AdminProfileResponseDto } from './admin-profile-response.dto';

export class AdminResponseDto {
  id: string;
  department?: string;
  user?: UserResponseDto | null;
  adminProfile?: AdminProfileResponseDto | null;
  createdAt: Date;
  updatedAt: Date;
}
