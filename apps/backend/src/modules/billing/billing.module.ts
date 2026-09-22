import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { EntitlementService } from '../../common/services/entitlement.service';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [AuditModule],
  controllers: [BillingController],
  providers: [BillingService, EntitlementService],
  exports: [BillingService],
})
export class BillingModule {}
