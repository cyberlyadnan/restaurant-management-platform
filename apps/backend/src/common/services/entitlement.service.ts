import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EntitlementService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveSubscription(restaurantId: string) {
    const now = new Date();
    return this.prisma.subscription.findFirst({
      where: {
        restaurantId,
        status: { in: ['ACTIVE', 'TRIAL'] },
        endDate: { gte: now },
      },
      include: {
        plan: true,
      },
      orderBy: {
        endDate: 'desc',
      },
    });
  }

  async isSubscriptionActive(restaurantId: string): Promise<boolean> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { status: true },
    });

    if (
      !restaurant ||
      restaurant.status === 'SUSPENDED' ||
      restaurant.status === 'EXPIRED'
    ) {
      return false;
    }

    const sub = await this.getActiveSubscription(restaurantId);
    return Boolean(sub);
  }

  async assertActiveSubscription(restaurantId: string): Promise<void> {
    const isActive = await this.isSubscriptionActive(restaurantId);
    if (!isActive) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        code: 'SUBSCRIPTION_SUSPENDED',
        message:
          'Subscription is inactive, expired, or suspended. Please renew your subscription to perform this action.',
      });
    }
  }

  async canUseFeature(
    restaurantId: string,
    featureKey: string,
  ): Promise<boolean> {
    const sub = await this.getActiveSubscription(restaurantId);
    if (!sub || !sub.plan) return false;
    return (
      sub.plan.features.includes(featureKey) ||
      sub.plan.features.includes('*') ||
      sub.plan.slug === 'enterprise'
    );
  }

  async assertFeature(
    restaurantId: string,
    featureKey: string,
    featureLabel?: string,
  ): Promise<void> {
    const allowed = await this.canUseFeature(restaurantId, featureKey);
    if (!allowed) {
      throw new ForbiddenException(
        `Feature "${featureLabel ?? featureKey}" is not included in your current subscription plan. Please upgrade to access this feature.`,
      );
    }
  }

  async assertLimit(
    restaurantId: string,
    limitType: 'branches' | 'users' | 'tables' | 'products',
  ): Promise<void> {
    const sub = await this.getActiveSubscription(restaurantId);
    if (!sub || !sub.plan) {
      throw new HttpException(
        'Active subscription required to add resources.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const plan = sub.plan;
    if (limitType === 'branches') {
      const count = await this.prisma.branch.count({
        where: { restaurantId, isActive: true },
      });
      if (count >= plan.maxBranches) {
        throw new ForbiddenException(
          `Branch limit reached (${count}/${plan.maxBranches}). Please upgrade your plan to add more branches.`,
        );
      }
    } else if (limitType === 'users') {
      const count = await this.prisma.user.count({
        where: { restaurantId, isActive: true },
      });
      if (count >= plan.maxUsers) {
        throw new ForbiddenException(
          `Staff user limit reached (${count}/${plan.maxUsers}). Please upgrade your plan to invite more staff.`,
        );
      }
    } else if (limitType === 'tables') {
      const count = await this.prisma.table.count({
        where: { floor: { branch: { restaurantId } } },
      });
      if (count >= plan.maxTables) {
        throw new ForbiddenException(
          `Table limit reached (${count}/${plan.maxTables}). Please upgrade your plan to configure more dining tables.`,
        );
      }
    } else if (limitType === 'products') {
      const count = await this.prisma.menuItem.count({
        where: { branch: { restaurantId }, isActive: true },
      });
      if (count >= plan.maxProducts) {
        throw new ForbiddenException(
          `Product limit reached (${count}/${plan.maxProducts}). Please upgrade your plan to add more menu items.`,
        );
      }
    }
  }

  async getTenantUsage(restaurantId: string) {
    const sub = await this.getActiveSubscription(restaurantId);
    const [branchCount, userCount, tableCount, productCount] =
      await Promise.all([
        this.prisma.branch.count({ where: { restaurantId, isActive: true } }),
        this.prisma.user.count({ where: { restaurantId, isActive: true } }),
        this.prisma.table.count({
          where: { floor: { branch: { restaurantId } } },
        }),
        this.prisma.menuItem.count({
          where: { branch: { restaurantId }, isActive: true },
        }),
      ]);

    return {
      subscription: sub
        ? {
            id: sub.id,
            status: sub.status,
            planName: sub.plan.name,
            planSlug: sub.plan.slug,
            billingPeriod: sub.billingPeriod,
            endDate: sub.endDate,
            trialEndsAt: sub.trialEndsAt,
          }
        : null,
      limits: sub?.plan
        ? {
            maxBranches: sub.plan.maxBranches,
            maxUsers: sub.plan.maxUsers,
            maxTables: sub.plan.maxTables,
            maxProducts: sub.plan.maxProducts,
            features: sub.plan.features,
          }
        : null,
      usage: {
        branches: branchCount,
        users: userCount,
        tables: tableCount,
        products: productCount,
      },
    };
  }
}
