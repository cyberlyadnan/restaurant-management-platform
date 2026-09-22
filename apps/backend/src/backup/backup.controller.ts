import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('backups')
@Controller('v1/backups')
export class BackupController {
  // Decommissioned for multi-tenant security:
  // Tenant applications cannot trigger pg_restore or database-wide backups.
}
