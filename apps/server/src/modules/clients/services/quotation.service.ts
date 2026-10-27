import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Quotation } from '../entities/quotation.entity';
import { User } from '../../users/entities/user.entity';
import {
  CreateQuotationDto,
  ApproveQuotationDto,
  RejectQuotationDto,
} from '../dto/quotation.dto';
import {
  Nationality,
  NotificationType,
  QuotationStatus,
} from '../enums/client.enums';
import { Role } from '../../users/enums/users-type.enum';
import { PageResponseDto } from '../../../common/dto/page-response';
import { NotificationService } from './notification.service';
import { RequestUser } from './application.service';

const ISLAM_FIXED_RATE = 20;
const ISLAM_FIXED_PERIOD_MONTHS = 60;

@Injectable()
export class QuotationService {
  constructor(
    @InjectRepository(Quotation)
    private readonly quotationRepo: Repository<Quotation>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(dto: CreateQuotationDto, userId: string): Promise<Quotation> {
    const isIslam = dto.nationality === Nationality.ISLAM;
    if (!isIslam && !dto.periodValue) {
      throw new BadRequestException('Investment period is required');
    }

    const quotation = this.quotationRepo.create({
      clientName: dto.clientName?.trim() || undefined,
      nationality: dto.nationality ?? Nationality.SINHALA,
      investmentAmount: dto.investmentAmount,
      propertyNumber: dto.propertyNumber,
      propertyPlanNumber: dto.propertyPlanNumber,
      periodValue: isIslam ? ISLAM_FIXED_PERIOD_MONTHS : dto.periodValue,
      periodUnit: isIslam ? 'months' : (dto.periodUnit ?? 'months'),
      status: QuotationStatus.PENDING,
      createdBy: { id: userId } as User,
    });

    // Shariah quotations use the fixed rate and are approved immediately
    if (isIslam) {
      Object.assign(
        quotation,
        this.calculate(dto.investmentAmount, ISLAM_FIXED_RATE, ISLAM_FIXED_PERIOD_MONTHS),
      );
      quotation.status = QuotationStatus.APPROVED;
      quotation.approvedAt = new Date();
    }

    const saved = await this.quotationRepo.save(quotation);
    return this.findById(saved.id);
  }

  async findAll(
    pageNumber: number,
    size: number,
    status?: QuotationStatus,
    userId?: string,
  ): Promise<PageResponseDto<Quotation>> {
    const where: FindOptionsWhere<Quotation> = {};
    if (status) where.status = status;
    if (userId) where.createdBy = { id: userId };

    const take = Math.min(Math.max(size, 1), 100);
    const [items, totalElements] = await this.quotationRepo.findAndCount({
      where,
      relations: { createdBy: true, approvedBy: true },
      order: { createdAt: 'DESC' },
      skip: Math.max(pageNumber, 0) * take,
      take,
    });

    const totalPages = Math.ceil(totalElements / take);
    return new PageResponseDto(items, pageNumber, take, totalElements, totalPages);
  }

  async findById(id: string): Promise<Quotation> {
    const quotation = await this.quotationRepo.findOne({
      where: { id },
      relations: { createdBy: true, approvedBy: true },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    return quotation;
  }

  async findForUser(id: string, user: RequestUser): Promise<Quotation> {
    const quotation = await this.findById(id);
    const isAdmin = [Role.Admin, Role.SuperAdmin].includes(user.role);
    if (!isAdmin && quotation.createdBy?.id !== user.sub) {
      throw new NotFoundException('Quotation not found');
    }
    return quotation;
  }

  async approve(
    id: string,
    dto: ApproveQuotationDto,
    adminId: string,
  ): Promise<Quotation> {
    const quotation = await this.findPending(id);

    const periodMonths =
      quotation.periodUnit === 'years'
        ? (quotation.periodValue || 0) * 12
        : quotation.periodValue || 0;

    Object.assign(
      quotation,
      this.calculate(Number(quotation.investmentAmount), dto.ratePercentage, periodMonths),
    );
    quotation.status = QuotationStatus.APPROVED;
    quotation.adminNotes = dto.adminNotes ?? '';
    quotation.approvedBy = { id: adminId } as User;
    quotation.approvedAt = new Date();
    await this.quotationRepo.save(quotation);

    await this.notifyCreator(
      quotation,
      'Quotation Approved',
      `Rate ${dto.ratePercentage}% set for ${quotation.clientName || 'your quotation'}.`,
      NotificationType.QUOTATION_APPROVED,
    );
    return this.findById(id);
  }

  async reject(
    id: string,
    dto: RejectQuotationDto,
    adminId: string,
  ): Promise<Quotation> {
    const quotation = await this.findPending(id);
    quotation.status = QuotationStatus.REJECTED;
    quotation.adminNotes = dto.adminNotes ?? '';
    quotation.approvedBy = { id: adminId } as User;
    await this.quotationRepo.save(quotation);

    await this.notifyCreator(
      quotation,
      'Quotation Rejected',
      `${quotation.clientName || 'Your quotation'}${dto.adminNotes ? `: ${dto.adminNotes}` : ' was rejected.'}`,
      NotificationType.QUOTATION_REJECTED,
    );
    return this.findById(id);
  }

  private async findPending(id: string): Promise<Quotation> {
    const quotation = await this.findById(id);
    if (quotation.status !== QuotationStatus.PENDING) {
      throw new BadRequestException('This quotation has already been reviewed');
    }
    return quotation;
  }

  /** Existing business rule: monthly profit = amount × rate%. */
  private calculate(amount: number, ratePercentage: number, periodMonths: number) {
    const monthlyProfit = amount * (ratePercentage / 100);
    const totalProfit = monthlyProfit * periodMonths;
    return {
      ratePercentage,
      monthlyProfit,
      totalProfit,
      maturityValue: amount + totalProfit,
    };
  }

  private async notifyCreator(
    quotation: Quotation,
    title: string,
    description: string,
    type: NotificationType,
  ) {
    if (!quotation.createdBy) return;
    await this.notificationService.create(
      quotation.createdBy.id,
      title,
      description,
      type,
      quotation.id,
    );
  }
}
