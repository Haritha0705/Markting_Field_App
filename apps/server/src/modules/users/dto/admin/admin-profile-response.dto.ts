export class AdminProfileResponseDto {
  id: string;
  dob: string;
  imgUrl: string;
  bio: string;
  officeLocation?: string;
  createdAt: Date;
  updatedAt: Date;
}
