import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { SessionUser } from '@nodedr-restaurant/types';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EntitlementService } from '../../common/services/entitlement.service';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('branches')
@Controller('v1/branches')
export class BranchesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlement: EntitlementService,
  ) {}

  @Auth()
  @Get()
  listBranches(@CurrentUser() user: SessionUser) {
    return this.prisma.branch.findMany({
      where: { restaurantId: user.restaurantId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  @Auth('settings.manage')
  @Post()
  async createBranch(
    @CurrentUser() user: SessionUser,
    @Body() body: { name: string; address?: string; phone?: string },
  ) {
    await this.entitlement.assertFeature(
      user.restaurantId,
      'multi_branch',
      'Multi-Branch Expansion',
    );
    await this.entitlement.assertLimit(user.restaurantId, 'branches');

    return this.prisma.branch.create({
      data: {
        restaurantId: user.restaurantId,
        name: body.name,
        address: body.address,
        phone: body.phone,
        isActive: true,
      },
    });
  }
}
