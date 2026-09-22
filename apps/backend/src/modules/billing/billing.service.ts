import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  BillingPeriod,
  RestaurantBillingOverview,
  RestaurantUpgradeDto,
} from '@nodedr-restaurant/types';
import { AuditService } from '../../audit/audit.service';
import { EntitlementService } from '../../common/services/entitlement.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlement: EntitlementService,
    private readonly audit: AuditService,
  ) {}

  async getOverview(restaurantId: string): Promise<RestaurantBillingOverview> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        subscriptions: {
          orderBy: { endDate: 'desc' },
          take: 1,
          include: { plan: true },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const latestSub = restaurant.subscriptions[0] ?? null;
    const now = new Date();
    const daysRemaining = latestSub
      ? Math.max(
          0,
          Math.ceil(
            (new Date(latestSub.endDate).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

    const [
      branchCount,
      userCount,
      tableCount,
      productCount,
      invoices,
      payments,
      availablePlans,
    ] = await Promise.all([
      this.prisma.branch.count({ where: { restaurantId, isActive: true } }),
      this.prisma.user.count({ where: { restaurantId, isActive: true } }),
      this.prisma.table.count({
        where: { floor: { branch: { restaurantId } } },
      }),
      this.prisma.menuItem.count({
        where: { branch: { restaurantId }, isActive: true },
      }),
      this.prisma.subscriptionInvoice.findMany({
        where: { restaurantId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.subscriptionPayment.findMany({
        where: { restaurantId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    const activePlan = latestSub?.plan ?? null;

    return {
      subscription: latestSub
        ? {
            id: latestSub.id,
            status: latestSub.status,
            planName: latestSub.plan.name,
            planSlug: latestSub.plan.slug,
            billingPeriod: latestSub.billingPeriod,
            startDate: latestSub.startDate.toISOString(),
            endDate: latestSub.endDate.toISOString(),
            trialEndsAt: latestSub.trialEndsAt
              ? latestSub.trialEndsAt.toISOString()
              : null,
            daysRemaining,
            isTrial: latestSub.status === 'TRIAL',
            isAutoRenew: latestSub.isAutoRenew,
          }
        : null,
      plan: activePlan
        ? {
            id: activePlan.id,
            name: activePlan.name,
            slug: activePlan.slug,
            description: activePlan.description,
            monthlyPrice: Number(activePlan.monthlyPrice),
            quarterlyPrice: activePlan.quarterlyPrice
              ? Number(activePlan.quarterlyPrice)
              : null,
            halfYearlyPrice: activePlan.halfYearlyPrice
              ? Number(activePlan.halfYearlyPrice)
              : null,
            yearlyPrice: Number(activePlan.yearlyPrice),
            currency: activePlan.currency,
            trialDays: activePlan.trialDays,
            isActive: activePlan.isActive,
            isPopular: activePlan.isPopular,
            sortOrder: activePlan.sortOrder,
            maxBranches: activePlan.maxBranches,
            maxUsers: activePlan.maxUsers,
            maxTables: activePlan.maxTables,
            maxProducts: activePlan.maxProducts,
            features: activePlan.features,
            createdAt: activePlan.createdAt.toISOString(),
            updatedAt: activePlan.updatedAt.toISOString(),
          }
        : null,
      usage: {
        branches: branchCount,
        users: userCount,
        tables: tableCount,
        products: productCount,
      },
      limits: activePlan
        ? {
            maxBranches: activePlan.maxBranches,
            maxUsers: activePlan.maxUsers,
            maxTables: activePlan.maxTables,
            maxProducts: activePlan.maxProducts,
          }
        : {
            maxBranches: 1,
            maxUsers: 5,
            maxTables: 15,
            maxProducts: 150,
          },
      features: activePlan ? activePlan.features : [],
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        subscriptionId: inv.subscriptionId ?? '',
        restaurantId: inv.restaurantId,
        amount: Number(inv.subtotal),
        tax: Number(inv.taxAmount),
        total: Number(inv.totalAmount),
        currency: inv.currency,
        status: inv.status,
        periodStart: inv.billingPeriodStart
          ? inv.billingPeriodStart.toISOString()
          : inv.createdAt.toISOString(),
        periodEnd: inv.billingPeriodEnd
          ? inv.billingPeriodEnd.toISOString()
          : inv.createdAt.toISOString(),
        dueDate: inv.dueDate ? inv.dueDate.toISOString() : inv.createdAt.toISOString(),
        paidAt: inv.paidAt ? inv.paidAt.toISOString() : null,
        notes: inv.notes,
        createdAt: inv.createdAt.toISOString(),
      })),
      payments: payments.map((pmt) => ({
        id: pmt.id,
        restaurantId: pmt.restaurantId,
        subscriptionId: pmt.subscriptionId,
        amount: Number(pmt.amount),
        currency: pmt.currency,
        method: pmt.method,
        status: pmt.status === 'SUCCESS' ? 'COMPLETED' : (pmt.status as any),
        reference: pmt.reference,
        notes: pmt.notes,
        createdAt: pmt.createdAt.toISOString(),
      })),
      availablePlans: availablePlans.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        monthlyPrice: Number(p.monthlyPrice),
        quarterlyPrice: p.quarterlyPrice ? Number(p.quarterlyPrice) : null,
        halfYearlyPrice: p.halfYearlyPrice ? Number(p.halfYearlyPrice) : null,
        yearlyPrice: Number(p.yearlyPrice),
        currency: p.currency,
        trialDays: p.trialDays,
        isActive: p.isActive,
        isPopular: p.isPopular,
        sortOrder: p.sortOrder,
        maxBranches: p.maxBranches,
        maxUsers: p.maxUsers,
        maxTables: p.maxTables,
        maxProducts: p.maxProducts,
        features: p.features,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    };
  }

  async upgradePlan(
    restaurantId: string,
    actorId: string,
    dto: RestaurantUpgradeDto,
  ) {
    const targetPlan = await this.prisma.plan.findUnique({
      where: { slug: dto.planSlug },
    });

    if (!targetPlan || !targetPlan.isActive) {
      throw new BadRequestException(
        'Selected plan is invalid or no longer active',
      );
    }

    const monthlyNum = Number(targetPlan.monthlyPrice);
    const priceMap: Record<BillingPeriod, number> = {
      MONTHLY: monthlyNum,
      QUARTERLY: Number(targetPlan.quarterlyPrice ?? monthlyNum * 3),
      HALF_YEARLY: Number(targetPlan.halfYearlyPrice ?? monthlyNum * 6),
      YEARLY: Number(targetPlan.yearlyPrice),
      CUSTOM: monthlyNum,
    };
    const amount = priceMap[dto.billingPeriod] ?? monthlyNum;

    const startDate = new Date();
    const endDate = new Date(startDate);
    if (dto.billingPeriod === 'YEARLY') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (dto.billingPeriod === 'HALF_YEARLY') {
      endDate.setMonth(endDate.getMonth() + 6);
    } else if (dto.billingPeriod === 'QUARTERLY') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countThisMonth = await this.prisma.subscriptionInvoice.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });
    const invoiceNumber = `INV-${yearMonth}-${String(countThisMonth + 1).padStart(4, '0')}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          restaurantId,
          planId: targetPlan.id,
          status: 'ACTIVE',
          billingPeriod: dto.billingPeriod,
          amount,
          currency: targetPlan.currency,
          startDate,
          endDate,
          isAutoRenew: true,
        },
      });

      await tx.restaurant.update({
        where: { id: restaurantId },
        data: { status: 'ACTIVE' },
      });

      const invoice = await tx.subscriptionInvoice.create({
        data: {
          invoiceNumber,
          subscriptionId: subscription.id,
          restaurantId,
          subtotal: amount,
          taxAmount: 0,
          discountAmount: 0,
          totalAmount: amount,
          currency: targetPlan.currency,
          status: 'ISSUED',
          billingPeriodStart: startDate,
          billingPeriodEnd: endDate,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          notes: `${targetPlan.name} Plan (${dto.billingPeriod}) renewal`,
        },
      });

      return { subscription, invoice };
    });

    await this.audit.record({
      userId: actorId,
      action: 'SUBSCRIPTION_UPGRADED',
      entity: 'Subscription',
      entityId: result.subscription.id,
      metadata: {
        planName: targetPlan.name,
        planSlug: targetPlan.slug,
        billingPeriod: dto.billingPeriod,
        amount,
        invoiceNumber: result.invoice.invoiceNumber,
      },
    });

    return this.getOverview(restaurantId);
  }
}
