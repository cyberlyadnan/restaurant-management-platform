import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { PlatformDashboardStats } from '@nodedr-restaurant/types';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformAuthGuard } from './auth/platform-auth.guard';

@ApiTags('platform-dashboard')
@UseGuards(PlatformAuthGuard)
@Controller('v1/platform/dashboard')
export class PlatformDashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getStats(): Promise<PlatformDashboardStats> {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalRestaurants,
      activeRestaurants,
      trialRestaurants,
      expiredRestaurants,
      suspendedRestaurants,
      pendingRestaurants,
      activeSubscriptions,
      expiringIn7Days,
      plans,
      allPayments,
      recentRestaurantsList,
    ] = await Promise.all([
      this.prisma.restaurant.count(),
      this.prisma.restaurant.count({ where: { status: 'ACTIVE' } }),
      this.prisma.restaurant.count({ where: { status: 'TRIAL' } }),
      this.prisma.restaurant.count({ where: { status: 'EXPIRED' } }),
      this.prisma.restaurant.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.restaurant.count({ where: { status: 'PENDING_APPROVAL' } }),
      this.prisma.subscription.count({
        where: {
          status: { in: ['ACTIVE', 'TRIAL'] },
          endDate: { gte: now },
        },
      }),
      this.prisma.subscription.count({
        where: {
          status: { in: ['ACTIVE', 'TRIAL'] },
          endDate: { gte: now, lte: in7Days },
        },
      }),
      this.prisma.plan.findMany({
        include: {
          _count: {
            select: { subscriptions: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.subscriptionPayment.findMany({
        where: { status: 'SUCCESS' },
        select: { amount: true, paymentDate: true },
      }),
      this.prisma.restaurant.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          subscriptions: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: { plan: { select: { name: true } } },
          },
        },
      }),
    ]);

    // Total revenue calculation
    const totalRevenue = allPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    // Active subscriptions list for MRR calculation
    const activeSubs = await this.prisma.subscription.findMany({
      where: {
        status: { in: ['ACTIVE', 'TRIAL'] },
        endDate: { gte: now },
      },
      include: { plan: true },
    });

    const monthlyRecurringRevenue = activeSubs.reduce((sum, s) => {
      if (s.billingPeriod === 'YEARLY') {
        return sum + Number(s.plan.yearlyPrice) / 12;
      }
      return sum + Number(s.plan.monthlyPrice);
    }, 0);

    // Plan distribution
    const planDistribution = plans.map((p) => ({
      planName: p.name,
      count: p._count.subscriptions,
    }));

    // Monthly revenue grouping (last 6 months)
    const monthMap = new Map<string, number>();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Seed last 6 calendar months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      monthMap.set(key, 0);
    }

    for (const p of allPayments) {
      const d = new Date(p.paymentDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) ?? 0) + Number(p.amount));
      }
    }

    const monthlyRevenue = Array.from(monthMap.entries()).map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue),
    }));

    const recentRestaurants = recentRestaurantsList.map((r) => ({
      id: r.id,
      name: r.name,
      ownerName: r.ownerName,
      ownerEmail: r.ownerEmail,
      status: r.status,
      planName: r.subscriptions[0]?.plan.name ?? null,
      createdAt: r.createdAt.toISOString(),
    }));

    return {
      totalRestaurants,
      activeRestaurants,
      trialRestaurants,
      expiredRestaurants,
      suspendedRestaurants,
      pendingRestaurants,
      monthlyRecurringRevenue: Math.round(monthlyRecurringRevenue),
      totalRevenue: Math.round(totalRevenue),
      activeSubscriptions,
      expiringIn7Days,
      planDistribution,
      recentRestaurants,
      monthlyRevenue,
    };
  }
}
