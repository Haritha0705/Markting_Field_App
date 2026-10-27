import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './entities/application.entity';
import { Investment } from './entities/investment.entity';
import { BankingDetail } from './entities/banking-detail.entity';
import { Nominee } from './entities/nominee.entity';
import { Document } from './entities/document.entity';
import { Payment } from './entities/payment.entity';
import { Quotation } from './entities/quotation.entity';
import { Notification } from './entities/notification.entity';
import { Branch } from './entities/branch.entity';
import { ApplicationService } from './services/application.service';
import { QuotationService } from './services/quotation.service';
import { NotificationService } from './services/notification.service';
import { ApplicationController } from './controllers/application.controller';
import { QuotationController } from './controllers/quotation.controller';
import { NotificationController } from './controllers/notification.controller';
import { BranchController } from './controllers/branch.controller';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Application,
      Investment,
      BankingDetail,
      Nominee,
      Document,
      Payment,
      Quotation,
      Notification,
      Branch,
    ]),
  ],
  controllers: [
    ApplicationController,
    QuotationController,
    NotificationController,
    BranchController,
    HealthController,
  ],
  providers: [
    ApplicationService,
    QuotationService,
    NotificationService,
  ],
  exports: [
    ApplicationService,
    QuotationService,
    NotificationService,
    TypeOrmModule,
  ],
})
export class ClientsModule {}
