import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  createPlanSchema,
  updatePlanSchema,
  type CreatePlanDto,
  type UpdatePlanDto,
  type PlatformSessionUser,
} from '@nodedr-restaurant/types';
import { PrismaService } from '../prisma/prisma.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PlatformAuthGuard } from './auth/platform-auth.guard';
import { CurrentPlatformUser } from './auth/current-platform-user.decorator';

@ApiTags('platform-plans')
@UseGuards(PlatformAuthGuard)
@Controller('v1/platform/plans')
export class PlatformPlansController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    return this.prisma.plan.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createPlanSchema))
  async create(
    @Body() dto: CreatePlanDto,
    @CurrentPlatformUser() platformUser: PlatformSessionUser,
  ) {
    const plan = await this.prisma.plan.create({
      data: dto as any,
    });

    await this.prisma.platformAuditLog.create({
      data: {
        platformUserId: platformUser.id,
        action: 'PLAN_CREATED',
        targetType: 'PLAN',
        targetId: plan.id,
        metadata: { name: plan.name, slug: plan.slug },
      },
    });

    return plan;
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updatePlanSchema))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
    @CurrentPlatformUser() platformUser: PlatformSessionUser,
  ) {
    const plan = await this.prisma.plan.update({
      where: { id },
      data: dto as any,
    });

    await this.prisma.platformAuditLog.create({
      data: {
        platformUserId: platformUser.id,
        action: 'PLAN_UPDATED',
        targetType: 'PLAN',
        targetId: plan.id,
        metadata: { name: plan.name, changes: dto },
      },
    });

    return plan;
  }
}
