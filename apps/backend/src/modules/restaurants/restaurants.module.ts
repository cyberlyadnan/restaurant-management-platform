import { Module } from '@nestjs/common';
import { EntitlementService } from '../../common/services/entitlement.service';
import { BranchesController } from './branches.controller';

@Module({
  controllers: [BranchesController],
  providers: [EntitlementService],
})
export class RestaurantsModule {}
