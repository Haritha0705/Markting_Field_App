import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { API_ROUTES } from '../../../common/constants';
import { QuotationService } from '../services/quotation.service';
import {
  CreateQuotationDto,
  ApproveQuotationDto,
  RejectQuotationDto,
} from '../dto/quotation.dto';
import { QuotationStatus } from '../enums/client.enums';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../users/enums/users-type.enum';

@Controller(API_ROUTES.QUOTATIONS)
export class QuotationController {
  constructor(private readonly quotationService: QuotationService) {}

  @Roles(Role.AGENT)
  @Post()
  create(@Body() dto: CreateQuotationDto, @Req() req: any) {
    return this.quotationService.create(dto, req.user.sub);
  }

  @Roles(Role.AGENT)
  @Get()
  findAll(
    @Req() req: any,
    @Query('pageNumber') pageNumber: number = 0,
    @Query('size') size: number = 20,
    @Query('status') status?: QuotationStatus,
  ) {
    return this.quotationService.findAll(pageNumber, size, status, req.user.sub);
  }

  @Roles(Role.SuperAdmin, Role.Admin)
  @Get('all')
  findAllAdmin(
    @Query('pageNumber') pageNumber: number = 0,
    @Query('size') size: number = 20,
    @Query('status') status?: QuotationStatus,
  ) {
    return this.quotationService.findAll(pageNumber, size, status);
  }

  @Roles(Role.AGENT, Role.SuperAdmin, Role.Admin)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.quotationService.findForUser(id, req.user);
  }

  @Roles(Role.SuperAdmin, Role.Admin)
  @Put(':id/approve')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveQuotationDto,
    @Req() req: any,
  ) {
    return this.quotationService.approve(id, dto, req.user.sub);
  }

  @Roles(Role.SuperAdmin, Role.Admin)
  @Put(':id/reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectQuotationDto,
    @Req() req: any,
  ) {
    return this.quotationService.reject(id, dto, req.user.sub);
  }
}
