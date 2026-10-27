import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In, Like, FindOptionsWhere } from 'typeorm';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Application } from '../entities/application.entity';
import { Investment } from '../entities/investment.entity';
import { BankingDetail } from '../entities/banking-detail.entity';
import { Nominee } from '../entities/nominee.entity';
1;
import { Document } from '../entities/document.entity';
import { Branch } from '../entities/branch.entity';
import { Payment } from '../entities/payment.entity';
import { Quotation } from '../entities/quotation.entity';
import { User } from '../../users/entities/user.entity';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { UpdateInvestmentDto } from '../dto/update-investment.dto';
import { UpdateBankingDto } from '../dto/update-banking.dto';
import { UpdateNomineesDto } from '../dto/update-nominees.dto';
import { UpdateDocumentsDto } from '../dto/update-documents.dto';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import {
  ApplicationStatus,
  ApplicationStep,
  DocumentStatus,
  DocumentType,
  NotificationType,
  PaymentType,
  QuotationStatus,
} from '../enums/client.enums';
import { Role } from '../../users/enums/users-type.enum';
import { PageResponseDto } from '../../../common/dto/page-response';
import {
  CloudinaryService,
  UploadedBuffer,
} from '../../../common/storage/cloudinary.service';
import { NotificationService } from './notification.service';

/** The authenticated caller, as attached to the request by AuthGuard. */
export interface RequestUser {
  sub: string;
  role: Role;
}

const ADMIN_ROLES = [Role.Admin, Role.SuperAdmin];
const EDITABLE_STATUSES = [ApplicationStatus.DRAFT, ApplicationStatus.REJECTED];
const OTP_TTL_SECONDS = 5 * 60;
const OTP_MAX_ATTEMPTS = 5;

/** Documents that must be uploaded before an application can be submitted. Supporting documents (NIC, address proof, photo) are optional. */
const REQUIRED_DOCUMENTS: DocumentType[] = [
  DocumentType.INVESTOR_SIGNATURE,
  DocumentType.OFFICER_SIGNATURE,
];

const DOCUMENT_NAMES: Record<DocumentType, string> = {
  [DocumentType.NIC_PASSPORT]: 'NIC / Passport Copy',
  [DocumentType.PROOF_OF_ADDRESS]: 'Proof of Address',
  [DocumentType.INVESTOR_PHOTOGRAPH]: 'Investor Photograph',
  [DocumentType.BANK_CONFIRMATION]: 'Bank Confirmation Letter',
  [DocumentType.SOURCE_OF_FUNDS]: 'Source of Funds Document',
  [DocumentType.LAND_ALLOCATION]: 'Land Allocation Document',
  [DocumentType.INVESTOR_SIGNATURE]: 'Investor Signature',
  [DocumentType.INVESTOR_FINGERPRINT]: 'Investor Fingerprint',
  [DocumentType.JOINT_WITNESS_SIGNATURE]: 'Joint / Witness Signature',
  [DocumentType.OFFICER_SIGNATURE]: 'Officer Signature',
};

const DEFAULT_DOCUMENTS: DocumentType[] = [
  DocumentType.NIC_PASSPORT,
  DocumentType.PROOF_OF_ADDRESS,
  DocumentType.INVESTOR_PHOTOGRAPH,
  DocumentType.BANK_CONFIRMATION,
  DocumentType.SOURCE_OF_FUNDS,
  DocumentType.LAND_ALLOCATION,
];

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(Investment)
    private readonly investmentRepo: Repository<Investment>,
    @InjectRepository(BankingDetail)
    private readonly bankingRepo: Repository<BankingDetail>,
    @InjectRepository(Nominee)
    private readonly nomineeRepo: Repository<Nominee>,
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    private readonly storage: CloudinaryService,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly notificationService: NotificationService,
  ) {}

  // ─── Wizard steps ──────────────────────────────────────────

  async create(
    dto: CreateApplicationDto,
    officerId: string,
  ): Promise<Application> {
    const referenceNumber = await this.generateReferenceNumber(dto.branchId);

    const application = this.applicationRepo.create({
      referenceNumber,
      investorType: dto.investorType,
      fullName: dto.fullName.trim(),
      nicPassport: dto.nicPassport.trim(),
      mobileNumber: dto.mobileNumber.trim(),
      jointInvestorName: dto.jointInvestorName,
      companyName: dto.companyName,
      otherInvestorType: dto.otherInvestorType,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      nationality: dto.nationality,
      residentialAddress: dto.residentialAddress,
      postalAddress:
        dto.postalSameAsResidential === false
          ? dto.postalAddress
          : dto.residentialAddress,
      postalSameAsResidential: dto.postalSameAsResidential ?? true,
      emailAddress: dto.emailAddress || undefined,
      occupation: dto.occupation,
      status: ApplicationStatus.DRAFT,
      currentStep: ApplicationStep.INVESTMENT,
      officer: { id: officerId } as User,
      branch: dto.branchId ? ({ id: dto.branchId } as Branch) : undefined,
    });

    const savedApp = await this.applicationRepo.save(application);

    // Create default document checklist
    await this.createDefaultDocuments(savedApp.id);

    return this.findById(savedApp.id);
  }

  async updatePersonalDetails(
    id: string,
    dto: CreateApplicationDto,
    user: RequestUser,
  ): Promise<Application> {
    const app = await this.findEditable(id, user);
    const mobileChanged =
      !!dto.mobileNumber && dto.mobileNumber.trim() !== app.mobileNumber;
    await this.applicationRepo.update(id, {
      investorType: dto.investorType ?? app.investorType,
      fullName: dto.fullName?.trim() ?? app.fullName,
      nicPassport: dto.nicPassport?.trim() ?? app.nicPassport,
      mobileNumber: dto.mobileNumber?.trim() ?? app.mobileNumber,
      jointInvestorName: dto.jointInvestorName,
      companyName: dto.companyName,
      otherInvestorType: dto.otherInvestorType,
      dateOfBirth: dto.dateOfBirth
        ? new Date(dto.dateOfBirth)
        : app.dateOfBirth,
      nationality: dto.nationality ?? app.nationality,
      residentialAddress: dto.residentialAddress ?? app.residentialAddress,
      postalAddress:
        dto.postalSameAsResidential === false
          ? (dto.postalAddress ?? app.postalAddress)
          : (dto.residentialAddress ?? app.residentialAddress),
      postalSameAsResidential:
        dto.postalSameAsResidential ?? app.postalSameAsResidential,
      emailAddress: dto.emailAddress || app.emailAddress,
      occupation: dto.occupation ?? app.occupation,
      branch: dto.branchId ? ({ id: dto.branchId } as Branch) : app.branch,
      currentStep: Math.max(app.currentStep, ApplicationStep.INVESTMENT),
      // A new number has to be verified again
      phoneVerified: mobileChanged ? false : app.phoneVerified,
    });
    return this.findById(id);
  }

  async updateInvestment(
    id: string,
    dto: UpdateInvestmentDto,
    user: RequestUser,
  ): Promise<Application> {
    const app = await this.findEditable(id, user);
    let investment = await this.investmentRepo.findOne({
      where: { application: { id } },
    });

    const totalAmount = Number(dto.totalAmount ?? investment?.totalAmount ?? 0);
    const paymentType =
      dto.paymentType ?? investment?.paymentType ?? PaymentType.FULL;
    if (totalAmount <= 0) {
      throw new BadRequestException('Total investment amount is required');
    }

    // Full payment means everything is paid up front
    const amountPaid =
      paymentType === PaymentType.FULL
        ? totalAmount
        : Number(dto.amountPaid ?? investment?.amountPaid ?? 0);
    if (amountPaid < 0 || amountPaid > totalAmount) {
      throw new BadRequestException(
        'Amount paid must be between 0 and the total amount',
      );
    }

    const toDate = (v?: string) => (v ? new Date(v) : undefined);
    const fields: Partial<Investment> = {
      assetCategory: dto.assetCategory,
      projectLocation: dto.projectLocation,
      packagePlotSize: dto.packagePlotSize,
      propertyNumber: dto.propertyNumber,
      propertyPlanNumber: dto.propertyPlanNumber,
      totalAmount,
      paymentType,
      amountPaid,
      balanceRemaining: totalAmount - amountPaid,
      monthlyRent: dto.monthlyRent,
      shariahCommission: dto.shariahCommission,
      programmePeriod: dto.programmePeriod,
      payoutMethod: dto.payoutMethod,
      chequeNumber: dto.chequeNumber,
      chequeAmount: dto.chequeAmount,
      paymentDate: toDate(dto.paymentDate),
      nextPaymentDate: toDate(dto.nextPaymentDate),
      chequeReleaseDate: toDate(dto.chequeReleaseDate),
    };
    // Only overwrite what the client actually sent
    Object.keys(fields).forEach(
      (k) => fields[k] === undefined && delete fields[k],
    );

    if (!investment) {
      investment = this.investmentRepo.create({
        ...fields,
        application: { id } as Application,
      });
    } else {
      Object.assign(investment, fields);
    }
    await this.investmentRepo.save(investment);

    await this.advanceStep(app, ApplicationStep.BANKING);
    return this.findById(id);
  }

  async updateBanking(
    id: string,
    dto: UpdateBankingDto,
    user: RequestUser,
  ): Promise<Application> {
    const app = await this.findEditable(id, user);
    let banking = await this.bankingRepo.findOne({
      where: { application: { id } },
    });

    if (!banking) {
      banking = this.bankingRepo.create({
        ...dto,
        application: { id } as Application,
      });
    } else {
      Object.assign(banking, dto);
    }
    await this.bankingRepo.save(banking);

    await this.advanceStep(app, ApplicationStep.NOMINEE);
    return this.findById(id);
  }

  async updateNominees(
    id: string,
    dto: UpdateNomineesDto,
    user: RequestUser,
  ): Promise<Application> {
    if (dto.nominees.length > 4) {
      throw new BadRequestException('Maximum of 4 nominees allowed');
    }
    if (dto.nominees.length > 0) {
      const share = dto.nominees.reduce(
        (sum, n) => sum + Number(n.profitPercentage || 0),
        0,
      );
      if (Math.abs(share - 100) > 0.01) {
        throw new BadRequestException(
          `Nominee profit shares must add up to 100% (currently ${share}%)`,
        );
      }
    }

    const app = await this.findEditable(id, user);

    // Replace the nominee list as a whole
    await this.nomineeRepo.delete({ application: { id } });
    const nominees = dto.nominees.map((n, i) =>
      this.nomineeRepo.create({
        ...n,
        nomineeNumber: i + 1,
        application: { id } as Application,
      }),
    );
    await this.nomineeRepo.save(nominees);

    await this.advanceStep(app, ApplicationStep.DOCUMENTS);
    return this.findById(id);
  }

  /** Marks documents as pending / not applicable (uploads go through uploadDocument). */
  async updateDocuments(
    id: string,
    dto: UpdateDocumentsDto,
    user: RequestUser,
  ): Promise<Application> {
    const app = await this.findEditable(id, user);

    for (const docDto of dto.documents) {
      const doc = await this.documentRepo.findOne({
        where: { application: { id }, documentType: docDto.documentType },
      });
      // UPLOADED can only be reached by actually uploading a file
      if (docDto.status === DocumentStatus.UPLOADED && !doc?.fileUrl) continue;
      if (doc) {
        doc.status = docDto.status;
        await this.documentRepo.save(doc);
      } else if (docDto.status !== DocumentStatus.UPLOADED) {
        await this.documentRepo.save(
          this.documentRepo.create({
            documentType: docDto.documentType,
            documentName: docDto.documentName,
            status: docDto.status,
            application: { id } as Application,
          }),
        );
      }
    }

    await this.advanceStep(app, ApplicationStep.DECLARATION);
    return this.findById(id);
  }

  async uploadDocument(
    id: string,
    documentType: DocumentType,
    file: UploadedBuffer,
    user: RequestUser,
  ): Promise<Application> {
    await this.findEditable(id, user);
    const stored = await this.storage.upload(file, `applications/${id}`);

    let doc = await this.documentRepo.findOne({
      where: { application: { id }, documentType },
    });
    const previousUrl = doc?.fileUrl;
    if (!doc) {
      doc = this.documentRepo.create({
        documentType,
        documentName: DOCUMENT_NAMES[documentType],
        application: { id } as Application,
      });
    }
    doc.status = DocumentStatus.UPLOADED;
    doc.fileUrl = stored.url;
    doc.fileSize = String(stored.size);
    doc.mimeType = stored.mimeType;
    doc.uploadedAt = new Date();
    // Don't leave an orphan file on Cloudinary if the record can't be saved
    await this.documentRepo.save(doc).catch(async (err) => {
      await this.storage.remove(stored.url);
      throw err;
    });

    if (previousUrl && previousUrl !== doc.fileUrl) {
      await this.storage.remove(previousUrl);
    }
    return this.findById(id);
  }

  async removeDocument(
    id: string,
    documentType: DocumentType,
    user: RequestUser,
  ): Promise<Application> {
    await this.findEditable(id, user);
    const doc = await this.documentRepo.findOne({
      where: { application: { id }, documentType },
    });
    if (doc) {
      await this.storage.remove(doc.fileUrl);
      doc.fileUrl = null as any;
      doc.fileSize = null as any;
      doc.mimeType = null as any;
      doc.uploadedAt = null;
      doc.status = DocumentStatus.PENDING;
      await this.documentRepo.save(doc);
    }
    return this.findById(id);
  }

  async acceptDeclaration(id: string, user: RequestUser): Promise<Application> {
    const app = await this.findEditable(id, user);
    await this.applicationRepo.update(id, {
      declarationAccepted: true,
      currentStep: ApplicationStep.SIGNATURE,
    });
    return this.findById(id);
  }

  // ─── Phone OTP ─────────────────────────────────────────────

  async sendOtp(id: string, user: RequestUser) {
    const app = await this.findEditable(id, user);
    const code = String(randomInt(100000, 1000000));
    await this.applicationRepo.update(id, {
      otpHash: await bcrypt.hash(code, 10),
      otpExpiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
      otpAttempts: 0,
    });

    // Until an SMS gateway is connected (SMS_GATEWAY set), the code is logged
    // and returned to the app so officers can finish onboarding. Once the
    // gateway is added the code is only sent by SMS and never returned.
    this.logger.log(
      `OTP for ${app.referenceNumber} (${app.mobileNumber}): ${code}`,
    );
    const smsConnected = !!process.env.SMS_GATEWAY;
    return {
      sentTo: app.mobileNumber,
      expiresInSeconds: OTP_TTL_SECONDS,
      ...(smsConnected ? {} : { devCode: code }),
    };
  }

  async verifyOtp(
    id: string,
    code: string,
    user: RequestUser,
  ): Promise<Application> {
    await this.findEditable(id, user);
    const secret = await this.applicationRepo.findOne({
      where: { id },
      select: {
        id: true,
        otpHash: true,
        otpExpiresAt: true,
        otpAttempts: true,
      },
    });
    if (!secret?.otpHash || !secret.otpExpiresAt) {
      throw new BadRequestException('Request an OTP first');
    }
    if (secret.otpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('OTP has expired. Request a new one');
    }
    if (secret.otpAttempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException('Too many attempts. Request a new OTP');
    }
    const ok = await bcrypt.compare(code, secret.otpHash);
    if (!ok) {
      await this.applicationRepo.update(id, {
        otpAttempts: secret.otpAttempts + 1,
      });
      throw new BadRequestException('Incorrect OTP');
    }
    await this.applicationRepo.update(id, {
      phoneVerified: true,
      otpHash: null,
      otpExpiresAt: null,
      otpAttempts: 0,
    });
    return this.findById(id);
  }

  // ─── Submission & review ───────────────────────────────────

  async submitApplication(id: string, user: RequestUser): Promise<Application> {
    const app = await this.findEditable(id, user);

    const missing: string[] = [];
    if (!app.investment || Number(app.investment.totalAmount) <= 0)
      missing.push('investment details');
    if (!app.declarationAccepted) missing.push('accepted declaration');
    if (!app.phoneVerified) missing.push('phone verification');
    for (const type of REQUIRED_DOCUMENTS) {
      const doc = app.documents?.find((d) => d.documentType === type);
      if (doc?.status !== DocumentStatus.UPLOADED)
        missing.push(DOCUMENT_NAMES[type]);
    }
    if (missing.length) {
      throw new BadRequestException(
        `Cannot submit yet. Missing: ${missing.join(', ')}`,
      );
    }

    await this.applicationRepo.update(id, {
      status: ApplicationStatus.PENDING_APPROVAL,
      submittedAt: new Date(),
      rejectionReason: null as any,
    });

    const admins = await this.applicationRepo.manager.find(User, {
      where: { role: In(ADMIN_ROLES), isActive: true },
      select: { id: true },
    });
    await Promise.all(
      admins.map((a) =>
        this.notificationService.create(
          a.id,
          'New Application Submitted',
          `${app.fullName} (${app.referenceNumber}) is waiting for approval.`,
          NotificationType.SYSTEM_UPDATE,
          app.id,
        ),
      ),
    );
    return this.findById(id);
  }

  async approve(id: string, adminId: string): Promise<Application> {
    const app = await this.findById(id);
    if (app.status !== ApplicationStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'Only applications pending approval can be approved',
      );
    }
    await this.applicationRepo.update(id, {
      status: ApplicationStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy: { id: adminId } as User,
      rejectionReason: null as any,
    });

    if (app.officer) {
      await this.notificationService.create(
        app.officer.id,
        'Client Verified',
        `${app.fullName} (${app.referenceNumber}) has been approved.`,
        NotificationType.APPLICATION_APPROVED,
        app.id,
      );
    }
    return this.findById(id);
  }

  async reject(
    id: string,
    reason: string,
    adminId: string,
  ): Promise<Application> {
    const app = await this.findById(id);
    if (app.status !== ApplicationStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'Only applications pending approval can be rejected',
      );
    }
    await this.applicationRepo.update(id, {
      status: ApplicationStatus.REJECTED,
      rejectionReason: reason.trim(),
      approvedBy: { id: adminId } as User,
    });

    if (app.officer) {
      await this.notificationService.create(
        app.officer.id,
        'Application Rejected',
        `${app.fullName} (${app.referenceNumber}): ${reason.trim()}`,
        NotificationType.APPLICATION_REJECTED,
        app.id,
      );
    }
    return this.findById(id);
  }

  // ─── Payments ──────────────────────────────────────────────

  async addPayment(
    id: string,
    dto: CreatePaymentDto,
    user: RequestUser,
  ): Promise<Application> {
    const app = await this.findForUser(id, user);
    if (
      ![
        ApplicationStatus.PENDING_APPROVAL,
        ApplicationStatus.APPROVED,
      ].includes(app.status)
    ) {
      throw new BadRequestException(
        'Payments can be recorded once the application is submitted',
      );
    }
    const investment = app.investment;
    if (!investment) {
      throw new BadRequestException('Application has no investment details');
    }
    const balance = Number(investment.balanceRemaining);
    if (dto.amount > balance + 0.001) {
      throw new BadRequestException(
        `Payment exceeds the remaining balance of Rs. ${balance.toLocaleString()}`,
      );
    }

    await this.applicationRepo.manager.transaction(async (em) => {
      await em.save(
        em.create(Payment, {
          amount: dto.amount,
          paymentDate: new Date(dto.paymentDate),
          paymentMethod: dto.paymentMethod,
          receiptNumber: dto.receiptNumber,
          notes: dto.notes,
          application: { id } as Application,
        }),
      );
      const amountPaid = Number(investment.amountPaid) + dto.amount;
      await em.update(Investment, investment.id, {
        amountPaid,
        balanceRemaining: Math.max(
          0,
          Number(investment.totalAmount) - amountPaid,
        ),
      });
    });

    if (app.officer && app.officer.id !== user.sub) {
      await this.notificationService.create(
        app.officer.id,
        'Payment Received',
        `Rs. ${dto.amount.toLocaleString()} received for ${app.fullName}.`,
        NotificationType.PAYMENT_RECEIVED,
        app.id,
      );
    }
    return this.findById(id);
  }

  // ─── Queries ───────────────────────────────────────────────

  async findAll(
    pageNumber: number,
    size: number,
    status?: string,
    search?: string,
    officerId?: string,
  ): Promise<PageResponseDto<Application>> {
    const base: FindOptionsWhere<Application> = {};
    const statuses = this.parseStatuses(status);
    if (statuses.length) base.status = In(statuses);
    if (officerId) base.officer = { id: officerId };

    const term = search?.trim();
    const where: FindOptionsWhere<Application>[] = term
      ? [
          { ...base, fullName: ILike(`%${term}%`) },
          { ...base, referenceNumber: ILike(`%${term}%`) },
          { ...base, nicPassport: ILike(`%${term}%`) },
          { ...base, mobileNumber: Like(`%${term}%`) },
        ]
      : [base];

    const take = Math.min(Math.max(size, 1), 100);
    const [items, totalElements] = await this.applicationRepo.findAndCount({
      where,
      relations: {
        investment: true,
        branch: true,
        officer: true,
      },
      order: { createdAt: 'DESC' },
      skip: Math.max(pageNumber, 0) * take,
      take,
    });

    const totalPages = Math.ceil(totalElements / take);
    return new PageResponseDto(
      items,
      pageNumber,
      take,
      totalElements,
      totalPages,
    );
  }

  async findById(id: string): Promise<Application> {
    const app = await this.applicationRepo.findOne({
      where: { id },
      relations: {
        investment: true,
        bankingDetail: true,
        nominees: true,
        documents: true,
        payments: true,
        branch: true,
        officer: true,
        approvedBy: true,
      },
      order: {
        nominees: { nomineeNumber: 'ASC' },
        payments: { paymentDate: 'DESC' },
      },
    });
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }

  /** Admins see everything; officers only their own applications. */
  async findForUser(id: string, user: RequestUser): Promise<Application> {
    const app = await this.findById(id);
    if (!ADMIN_ROLES.includes(user.role) && app.officer?.id !== user.sub) {
      throw new NotFoundException('Application not found');
    }
    return app;
  }

  async getStats(officerId?: string) {
    const where: FindOptionsWhere<Application> = {};
    if (officerId) where.officer = { id: officerId };

    const countBy = (status: ApplicationStatus[]) =>
      this.applicationRepo.count({ where: { ...where, status: In(status) } });

    const [total, drafts, pending, verified, rejected] = await Promise.all([
      this.applicationRepo.count({ where }),
      countBy([ApplicationStatus.DRAFT]),
      countBy([
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.PENDING_APPROVAL,
      ]),
      countBy([ApplicationStatus.APPROVED]),
      countBy([ApplicationStatus.REJECTED]),
    ]);

    const qb = this.investmentRepo
      .createQueryBuilder('inv')
      .innerJoin('inv.application', 'app')
      .select('COALESCE(SUM(inv.total_amount), 0)', 'invested')
      .addSelect('COALESCE(SUM(inv.amount_paid), 0)', 'collected')
      .where('app.status = :approved', {
        approved: ApplicationStatus.APPROVED,
      });
    if (officerId) qb.andWhere('app.officer_id = :officerId', { officerId });
    const sums = await qb.getRawOne<{ invested: string; collected: string }>();

    return {
      total,
      drafts,
      pending,
      verified,
      rejected,
      totalInvestment: Number(sums?.invested ?? 0),
      totalCollected: Number(sums?.collected ?? 0),
    };
  }

  async getAdminStats() {
    const [stats, pendingQuotations, activeOfficers] = await Promise.all([
      this.getStats(),
      this.applicationRepo.manager.count(Quotation, {
        where: { status: QuotationStatus.PENDING },
      }),
      this.applicationRepo.manager.count(User, {
        where: { role: Role.AGENT, isActive: true },
      }),
    ]);
    return { ...stats, pendingQuotations, activeOfficers };
  }

  findBranches(): Promise<Branch[]> {
    return this.branchRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  // ─── Helpers ───────────────────────────────────────────────

  /**
   * Moves the wizard forward. Uses update() rather than save(app): saving the
   * loaded graph would cascade its stale relations and unlink child rows.
   */
  private async advanceStep(app: Application, step: ApplicationStep) {
    if (app.currentStep < step) {
      await this.applicationRepo.update(app.id, { currentStep: step });
    }
  }

  private async findEditable(
    id: string,
    user: RequestUser,
  ): Promise<Application> {
    const app = await this.findForUser(id, user);
    if (!EDITABLE_STATUSES.includes(app.status)) {
      throw new BadRequestException(
        'This application has been submitted and can no longer be edited',
      );
    }
    return app;
  }

  private parseStatuses(status?: string): ApplicationStatus[] {
    if (!status) return [];
    const valid = Object.values(ApplicationStatus) as string[];
    return status
      .split(',')
      .map((s) => s.trim())
      .filter((s) => valid.includes(s)) as ApplicationStatus[];
  }

  private async generateReferenceNumber(branchId?: string): Promise<string> {
    let branchCode = 'PGG';
    if (branchId) {
      const branch = await this.branchRepo.findOne({
        where: { id: branchId },
      });
      if (!branch) throw new BadRequestException('Unknown branch');
      branchCode = branch.code;
    }
    const prefix = `${branchCode}-${new Date().getFullYear()}-`;
    // Continue from the highest number used for this prefix, not the row count
    const last = await this.applicationRepo.findOne({
      where: { referenceNumber: Like(`${prefix}%`) },
      order: { referenceNumber: 'DESC' },
      select: { id: true, referenceNumber: true },
    });
    const lastSeq = last
      ? parseInt(last.referenceNumber.slice(prefix.length))
      : 0;
    return `${prefix}${String((lastSeq || 0) + 1).padStart(5, '0')}`;
  }

  private async createDefaultDocuments(applicationId: string): Promise<void> {
    const docs = DEFAULT_DOCUMENTS.map((type) =>
      this.documentRepo.create({
        documentType: type,
        documentName: DOCUMENT_NAMES[type],
        status: DocumentStatus.PENDING,
        application: { id: applicationId } as Application,
      }),
    );
    await this.documentRepo.save(docs);
  }
}
