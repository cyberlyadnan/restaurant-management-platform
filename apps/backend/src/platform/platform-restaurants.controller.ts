import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import {
  createRestaurantEnrollmentSchema,
  updateRestaurantStatusSchema,
  activateSubscriptionSchema,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
  STAFF_ROLES,
  type CreateRestaurantEnrollmentDto,
  type UpdateRestaurantStatusDto,
  type ActivateSubscriptionDto,
  type PlatformSessionUser,
} from '@nodedr-restaurant/types';
import { PrismaService } from '../prisma/prisma.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PlatformAuthGuard } from './auth/platform-auth.guard';
import { CurrentPlatformUser } from './auth/current-platform-user.decorator';

@ApiTags('platform-restaurants')
@UseGuards(PlatformAuthGuard)
@Controller('v1/platform/restaurants')
export class PlatformRestaurantsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
        { ownerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const restaurants = await this.prisma.restaurant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        subscriptions: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { plan: true },
        },
        _count: {
          select: {
            branches: true,
            users: true,
          },
        },
      },
    });

    return restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      legalName: r.legalName,
      currency: r.currency,
      timezone: r.timezone,
      status: r.status,
      ownerName: r.ownerName,
      ownerEmail: r.ownerEmail,
      ownerPhone: r.ownerPhone,
      branchCount: r._count.branches,
      userCount: r._count.users,
      createdAt: r.createdAt,
      activeSubscription: r.subscriptions[0] ?? null,
    }));
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createRestaurantEnrollmentSchema))
  async enroll(
    @Body() dto: CreateRestaurantEnrollmentDto,
    @CurrentPlatformUser() platformUser: PlatformSessionUser,
  ) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.ownerEmail },
    });
    if (existingUser) {
      throw new BadRequestException('A user with this email already exists');
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) {
      throw new NotFoundException('Selected subscription plan not found');
    }

    // Ensure permissions are seeded
    for (const permission of PERMISSIONS) {
      await this.prisma.permission.upsert({
        where: { key: permission.key },
        update: {},
        create: permission,
      });
    }
    const allPermissions = await this.prisma.permission.findMany();
    const permissionByKey = new Map(allPermissions.map((p) => [p.key, p]));

    const passwordHash = await bcrypt.hash(dto.initialPassword, 10);

    const now = new Date();
    const endDate = new Date(now);
    if (dto.billingPeriod === 'YEARLY') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (dto.billingPeriod === 'HALF_YEARLY') {
      endDate.setMonth(endDate.getMonth() + 6);
    } else if (dto.billingPeriod === 'QUARTERLY') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const planAmount =
      dto.amount !== undefined
        ? dto.amount
        : dto.billingPeriod === 'YEARLY'
          ? Number(plan.yearlyPrice)
          : Number(plan.monthlyPrice);

    return this.prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: {
          name: dto.name,
          legalName: dto.legalName,
          currency: dto.currency,
          timezone: dto.timezone,
          ownerName: dto.ownerName,
          ownerEmail: dto.ownerEmail,
          ownerPhone: dto.ownerPhone,
          status: dto.status,
        },
      });

      const branch = await tx.branch.create({
        data: {
          restaurantId: restaurant.id,
          name: dto.branchName,
        },
      });

      let ownerRoleId = '';
      for (const roleName of STAFF_ROLES) {
        const role = await tx.role.create({
          data: {
            restaurantId: restaurant.id,
            name: roleName,
            label: roleName.replace(/_/g, ' '),
          },
        });
        if (roleName === 'OWNER') ownerRoleId = role.id;

        const grantedKeys = DEFAULT_ROLE_PERMISSIONS[roleName];
        await tx.rolePermission.createMany({
          data: grantedKeys
            .map((key) => permissionByKey.get(key))
            .filter((p): p is NonNullable<typeof p> => Boolean(p))
            .map((permission) => ({
              roleId: role.id,
              permissionId: permission.id,
            })),
        });
      }

      const user = await tx.user.create({
        data: {
          restaurantId: restaurant.id,
          roleId: ownerRoleId,
          name: dto.ownerName,
          email: dto.ownerEmail,
          phone: dto.ownerPhone,
          passwordHash,
        },
      });

      await tx.userBranch.create({
        data: { userId: user.id, branchId: branch.id },
      });

      const subscription = await tx.subscription.create({
        data: {
          restaurantId: restaurant.id,
          planId: plan.id,
          status: dto.status === 'TRIAL' ? 'TRIAL' : 'ACTIVE',
          billingPeriod: dto.billingPeriod,
          amount: planAmount,
          currency: dto.currency,
          startDate: now,
          endDate,
          notes: dto.notes ?? 'Manual platform enrollment',
        },
      });

      // Record invoice & payment if active
      if (dto.status === 'ACTIVE' && planAmount > 0) {
        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        const payment = await tx.subscriptionPayment.create({
          data: {
            restaurantId: restaurant.id,
            subscriptionId: subscription.id,
            amount: planAmount,
            currency: dto.currency,
            method: 'MANUAL_BANK_TRANSFER',
            status: 'SUCCESS',
            reference: 'ENROLLMENT-ACTIVATION',
            notes: 'Initial enrollment payment recorded by platform admin',
            recordedById: platformUser.id,
          },
        });

        await tx.subscriptionInvoice.create({
          data: {
            invoiceNumber,
            restaurantId: restaurant.id,
            subscriptionId: subscription.id,
            paymentId: payment.id,
            subtotal: planAmount,
            totalAmount: planAmount,
            currency: dto.currency,
            status: 'PAID',
            paidAt: now,
          },
        });
      }

      await tx.platformAuditLog.create({
        data: {
          platformUserId: platformUser.id,
          action: 'RESTAURANT_ENROLLED',
          targetType: 'RESTAURANT',
          targetId: restaurant.id,
          metadata: { name: restaurant.name, plan: plan.name },
        },
      });

      return {
        restaurant,
        branch,
        owner: { id: user.id, name: user.name, email: user.email },
        subscription,
      };
    });
  }

  @Get(':id')
  async getDetails(@Param('id') id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        branches: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            role: { select: { name: true, label: true } },
            createdAt: true,
          },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          include: { plan: true },
        },
        subscriptionPayments: {
          orderBy: { paymentDate: 'desc' },
          include: { recordedBy: { select: { name: true } } },
        },
        subscriptionInvoices: {
          orderBy: { issueDate: 'desc' },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const [tableCount, productCount, orderCount] = await Promise.all([
      this.prisma.table.count({
        where: { floor: { branch: { restaurantId: id } } },
      }),
      this.prisma.menuItem.count({
        where: { branch: { restaurantId: id } },
      }),
      this.prisma.order.count({
        where: { branch: { restaurantId: id } },
      }),
    ]);

    return {
      restaurant,
      metrics: {
        tables: tableCount,
        products: productCount,
        orders: orderCount,
      },
    };
  }

  @Patch(':id/status')
  @UsePipes(new ZodValidationPipe(updateRestaurantStatusSchema))
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantStatusDto,
    @CurrentPlatformUser() platformUser: PlatformSessionUser,
  ) {
    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data: { status: dto.status },
    });

    await this.prisma.platformAuditLog.create({
      data: {
        platformUserId: platformUser.id,
        action: 'RESTAURANT_STATUS_UPDATED',
        targetType: 'RESTAURANT',
        targetId: id,
        metadata: { newStatus: dto.status, notes: dto.notes },
      },
    });

    return restaurant;
  }

  @Post(':id/subscriptions')
  @UsePipes(new ZodValidationPipe(activateSubscriptionSchema))
  async activateSubscription(
    @Param('id') id: string,
    @Body() dto: ActivateSubscriptionDto,
    @CurrentPlatformUser() platformUser: PlatformSessionUser,
  ) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = new Date(dto.endDate);

    const subscription = await this.prisma.$transaction(async (tx) => {
      // Mark prior active subscriptions as cancelled or replaced
      await tx.subscription.updateMany({
        where: { restaurantId: id, status: { in: ['ACTIVE', 'TRIAL'] } },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });

      const sub = await tx.subscription.create({
        data: {
          restaurantId: id,
          planId: plan.id,
          status: 'ACTIVE',
          billingPeriod: dto.billingPeriod,
          amount: dto.amount,
          currency: dto.currency,
          startDate,
          endDate,
          notes: dto.notes,
          isAutoRenew: dto.isAutoRenew,
        },
      });

      // Update restaurant status to ACTIVE
      await tx.restaurant.update({
        where: { id },
        data: { status: 'ACTIVE' },
      });

      if (dto.recordPayment && dto.amount > 0) {
        const payment = await tx.subscriptionPayment.create({
          data: {
            restaurantId: id,
            subscriptionId: sub.id,
            amount: dto.amount,
            currency: dto.currency,
            method: dto.paymentMethod,
            status: 'SUCCESS',
            reference: dto.paymentReference ?? 'MANUAL-SUBSCRIPTION-ACTIVATION',
            notes: dto.notes,
            recordedById: platformUser.id,
          },
        });

        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        await tx.subscriptionInvoice.create({
          data: {
            invoiceNumber,
            restaurantId: id,
            subscriptionId: sub.id,
            paymentId: payment.id,
            subtotal: dto.amount,
            totalAmount: dto.amount,
            currency: dto.currency,
            status: 'PAID',
            paidAt: new Date(),
          },
        });
      }

      await tx.platformAuditLog.create({
        data: {
          platformUserId: platformUser.id,
          action: 'SUBSCRIPTION_ACTIVATED',
          targetType: 'SUBSCRIPTION',
          targetId: sub.id,
          metadata: {
            restaurantId: id,
            planName: plan.name,
            amount: dto.amount,
          },
        },
      });

      return sub;
    });

    return subscription;
  }
}
