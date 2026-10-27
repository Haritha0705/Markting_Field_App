import { Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'OTP must be 6 digits' })
  code: string;
}
