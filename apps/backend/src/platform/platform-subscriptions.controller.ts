import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { PlatformSessionUser } from '@nodedr-restaurant/types';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformAuthGuard } from './auth/platform-auth.guard';
import { CurrentPlatformUser } from './auth/current-platform-user.decorator';

@ApiTags('platform-subscriptions')
@UseGuards(PlatformAuthGuard)
@Controller('v1/platform/subscriptions')
export class PlatformSubscriptionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('status') status?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return this.prisma.subscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            ownerName: true,
            ownerEmail: true,
            status: true,
          },
        },
        plan: true,
      },
    });
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentPlatformUser() platformUser: PlatformSessionUser,
  ) {
    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled by platform admin',
      },
    });

    await this.prisma.platformAuditLog.create({
      data: {
        platformUserId: platformUser.id,
        action: 'SUBSCRIPTION_CANCELLED',
        targetType: 'SUBSCRIPTION',
        targetId: id,
        metadata: { reason },
      },
    });

    return subscription;
  }

  @Post(':id/extend')
  async extend(
    @Param('id') id: string,
    @Body('days') days: number,
    @CurrentPlatformUser() platformUser: PlatformSessionUser,
  ) {
    const existing = await this.prisma.subscription.findUnique({
      where: { id },
    });
    if (!existing) throw new Error('Subscription not found');

    const newEndDate = new Date(existing.endDate);
    newEndDate.setDate(newEndDate.getDate() + (days || 30));

    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        endDate: newEndDate,
        status: 'ACTIVE',
      },
    });

    // Update restaurant to ACTIVE if was expired
    await this.prisma.restaurant.update({
      where: { id: existing.restaurantId },
      data: { status: 'ACTIVE' },
    });

    await this.prisma.platformAuditLog.create({
      data: {
        platformUserId: platformUser.id,
        action: 'SUBSCRIPTION_EXTENDED',
        targetType: 'SUBSCRIPTION',
        targetId: id,
        metadata: { addedDays: days, newEndDate },
      },
    });

    return subscription;
  }
}
