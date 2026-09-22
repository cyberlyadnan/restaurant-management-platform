import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { EntitlementService } from '../../common/services/entitlement.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuditModule],
  controllers: [UsersController],
  providers: [UsersService, EntitlementService],
})
export class UsersModule {}
