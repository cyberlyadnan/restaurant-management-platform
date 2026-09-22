import { Module } from '@nestjs/common';
import { BranchAccessService } from '../../common/services/branch-access.service';
import { EntitlementService } from '../../common/services/entitlement.service';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';

@Module({
  controllers: [TablesController],
  providers: [TablesService, BranchAccessService, EntitlementService],
})
export class TablesModule {}
