import { JwtAuthService } from '../service/jwt.service';
import {
  API_ROUTES,
  MAX_UPLOAD_BYTES,
  UPLOAD_ROOT,
} from '../../../common/constants';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Put,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { Public } from '../decorators/public.decorator';
import { LoginRequestDto } from '../dto/login-request.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateMeDto } from '../dto/update-me.dto';

const photoUploadOptions = {
  storage: diskStorage({
    destination: UPLOAD_ROOT,
    filename: (_req, file, cb) =>
      cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) =>
    /^image\/(jpeg|png|webp)$/.test(file.mimetype)
      ? cb(null, true)
      : cb(new BadRequestException('Only JPG, PNG or WEBP images'), false),
};

@Controller(API_ROUTES.AUTH)
export class AuthController {
  constructor(private readonly jwtAuthService: JwtAuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginRequestDto) {
    const user = await this.jwtAuthService.validateUser(dto);
    const token = this.jwtAuthService.generateToken(user);
    return {
      message: 'Login successful',
      token,
      accessToken: token,
      user: {
        id: user.id,
        sub: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  @Get('me')
  me(@Req() req: any) {
    return this.jwtAuthService.getMe(req.user.sub);
  }

  @Patch('me')
  updateMe(@Req() req: any, @Body() dto: UpdateMeDto) {
    return this.jwtAuthService.updateMe(req.user.sub, dto);
  }

  /** multipart/form-data: `file` */
  @Post('me/photo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', photoUploadOptions))
  uploadPhoto(@Req() req: any, @UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.jwtAuthService.updatePhoto(req.user.sub, file);
  }

  @Delete('me/photo')
  removePhoto(@Req() req: any) {
    return this.jwtAuthService.removePhoto(req.user.sub);
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    await this.jwtAuthService.changePassword(req.user.sub, dto);
    return { message: 'Password updated' };
  }
}
