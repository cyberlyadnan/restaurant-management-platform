import { Module } from '@nestjs/common';

// Decommissioned for multi-tenant security:
// Database-level backups and pg_restore are managed exclusively by platform infrastructure.
@Module({})
export class BackupModule {}
