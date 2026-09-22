import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('public-plans')
@Controller('v1/public/plans')
export class PublicPlansController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getPublicPlans() {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return plans.map((p) => ({
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
      isPopular: p.isPopular,
      limits: {
        maxBranches: p.maxBranches,
        maxUsers: p.maxUsers,
        maxTables: p.maxTables,
        maxProducts: p.maxProducts,
      },
      features: p.features,
    }));
  }
}
