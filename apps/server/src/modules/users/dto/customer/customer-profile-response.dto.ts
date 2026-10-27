export class CustomerProfileResponseDto {
  id: string;
  dob: string;
  imgUrl: string;
  bio: string;
  shippingAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}
