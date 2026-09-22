import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { EntitlementService } from '../common/services/entitlement.service';
import { SubscriptionGuard } from '../common/guards/subscription.guard';

import { BranchAccessService } from '../common/services/branch-access.service';

@Global()
@Module({
  providers: [
    PrismaService,
    EntitlementService,
    SubscriptionGuard,
    BranchAccessService,
  ],
  exports: [
    PrismaService,
    EntitlementService,
    SubscriptionGuard,
    BranchAccessService,
  ],
})
export class PrismaModule {}
