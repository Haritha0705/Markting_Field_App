import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { API_ROUTES, MAX_UPLOAD_BYTES } from '../../../common/constants';
import { ApplicationService } from '../services/application.service';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { UpdateInvestmentDto } from '../dto/update-investment.dto';
import { UpdateBankingDto } from '../dto/update-banking.dto';
import { UpdateNomineesDto } from '../dto/update-nominees.dto';
import { UpdateDocumentsDto } from '../dto/update-documents.dto';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { RejectApplicationDto } from '../dto/reject-application.dto';
import { UploadDocumentDto } from '../dto/upload-document.dto';
import { DocumentType } from '../enums/client.enums';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../users/enums/users-type.enum';

const ALLOWED_MIME = /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/;

const uploadOptions = {
  // Held in memory and streamed to Cloudinary by the service
  storage: memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) =>
    ALLOWED_MIME.test(file.mimetype)
      ? cb(null, true)
      : cb(
          new BadRequestException('Only JPG, PNG, WEBP, HEIC or PDF files'),
          false,
        ),
};

@Controller(API_ROUTES.APPLICATIONS)
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  // ─── Officer ───────────────────────────────────────────────

  @Roles(Role.AGENT)
  @Post()
  create(@Body() dto: CreateApplicationDto, @Req() req: any) {
    return this.applicationService.create(dto, req.user.sub);
  }

  @Roles(Role.AGENT)
  @Get()
  findAll(
    @Req() req: any,
    @Query('pageNumber') pageNumber: number = 0,
    @Query('size') size: number = 10,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.applicationService.findAll(
      pageNumber,
      size,
      status,
      search,
      req.user.sub,
    );
  }

  @Roles(Role.AGENT)
  @Get('stats')
  getStats(@Req() req: any) {
    return this.applicationService.getStats(req.user.sub);
  }

  // ─── Admin ─────────────────────────────────────────────────

  @Roles(Role.SuperAdmin, Role.Admin)
  @Get('all')
  findAllAdmin(
    @Query('pageNumber') pageNumber: number = 0,
    @Query('size') size: number = 10,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('officerId') officerId?: string,
  ) {
    return this.applicationService.findAll(
      pageNumber,
      size,
      status,
      search,
      officerId,
    );
  }

  @Roles(Role.SuperAdmin, Role.Admin)
  @Get('admin/stats')
  getAdminStats() {
    return this.applicationService.getAdminStats();
  }

  @Roles(Role.SuperAdmin, Role.Admin)
  @Put(':id/approve')
  approve(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.applicationService.approve(id, req.user.sub);
  }

  @Roles(Role.SuperAdmin, Role.Admin)
  @Put(':id/reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectApplicationDto,
    @Req() req: any,
  ) {
    return this.applicationService.reject(id, dto.reason, req.user.sub);
  }

  // ─── Shared (ownership checked in the service) ─────────────

  @Roles(Role.AGENT, Role.SuperAdmin, Role.Admin)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.applicationService.findForUser(id, req.user);
  }

  @Roles(Role.AGENT, Role.SuperAdmin, Role.Admin)
  @Post(':id/payments')
  addPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePaymentDto,
    @Req() req: any,
  ) {
    return this.applicationService.addPayment(id, dto, req.user);
  }

  // ─── Wizard steps (officer, draft / rejected only) ─────────

  @Roles(Role.AGENT)
  @Put(':id/personal')
  updatePersonal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateApplicationDto,
    @Req() req: any,
  ) {
    return this.applicationService.updatePersonalDetails(id, dto, req.user);
  }

  @Roles(Role.AGENT)
  @Put(':id/investment')
  updateInvestment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvestmentDto,
    @Req() req: any,
  ) {
    return this.applicationService.updateInvestment(id, dto, req.user);
  }

  @Roles(Role.AGENT)
  @Put(':id/banking')
  updateBanking(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBankingDto,
    @Req() req: any,
  ) {
    return this.applicationService.updateBanking(id, dto, req.user);
  }

  @Roles(Role.AGENT)
  @Put(':id/nominees')
  updateNominees(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNomineesDto,
    @Req() req: any,
  ) {
    return this.applicationService.updateNominees(id, dto, req.user);
  }

  @Roles(Role.AGENT)
  @Put(':id/documents')
  updateDocuments(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentsDto,
    @Req() req: any,
  ) {
    return this.applicationService.updateDocuments(id, dto, req.user);
  }

  /** multipart/form-data: `file` + `documentType` */
  @Roles(Role.AGENT)
  @Post(':id/documents/upload')
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  uploadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.applicationService.uploadDocument(
      id,
      dto.documentType,
      file,
      req.user,
    );
  }

  @Roles(Role.AGENT)
  @Delete(':id/documents/:documentType')
  removeDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('documentType', new ParseEnumPipe(DocumentType))
    documentType: DocumentType,
    @Req() req: any,
  ) {
    return this.applicationService.removeDocument(id, documentType, req.user);
  }

  @Roles(Role.AGENT)
  @Put(':id/declaration')
  acceptDeclaration(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.applicationService.acceptDeclaration(id, req.user);
  }

  @Roles(Role.AGENT)
  @Post(':id/otp/send')
  @HttpCode(HttpStatus.OK)
  sendOtp(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.applicationService.sendOtp(id, req.user);
  }

  @Roles(Role.AGENT)
  @Post(':id/otp/verify')
  @HttpCode(HttpStatus.OK)
  verifyOtp(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyOtpDto,
    @Req() req: any,
  ) {
    return this.applicationService.verifyOtp(id, dto.code, req.user);
  }

  @Roles(Role.AGENT)
  @Put(':id/submit')
  submit(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.applicationService.submitApplication(id, req.user);
  }
}
