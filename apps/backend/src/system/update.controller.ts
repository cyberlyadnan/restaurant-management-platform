import { Controller, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('system')
@Controller('v1/system')
export class UpdateController {
  // Decommissioned for multi-tenant security:
  // Tenant applications cannot access Docker socket or host updates.
}
