import { Role } from '../enums/users-type.enum';
import { ProfileResponseDto } from './profile-response.dto';

export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  profile?: ProfileResponseDto | null;
  createdAt: Date;
  updatedAt: Date;
}
