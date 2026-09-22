import { Module } from '@nestjs/common';

// Decommissioned for multi-tenant security:
// Host updates and container orchestration are strictly managed via CI/CD.
@Module({})
export class SystemModule {}
