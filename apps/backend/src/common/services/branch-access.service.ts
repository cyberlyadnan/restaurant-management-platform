import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Branch access control service.
 * Verifies that a branch exists within the caller's restaurant AND that
 * non-owner staff have an active UserBranch assignment for the requested branch.
 */
@Injectable()
export class BranchAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertAccess(
    restaurantId: string,
    branchId: string,
    userId?: string,
  ): Promise<void> {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, restaurantId },
      select: { id: true },
    });
    if (!branch) {
      throw new ForbiddenException('Branch not found or not accessible');
    }

    if (!userId) {
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        restaurantId: true,
        role: { select: { name: true } },
      },
    });

    if (!user || user.restaurantId !== restaurantId) {
      throw new ForbiddenException(
        'User not found or does not belong to this restaurant',
      );
    }

    // Owner role has full access to all branches belonging to their restaurant
    if (user.role?.name === 'OWNER') {
      return;
    }

    // Non-owner staff must be assigned to the branch in UserBranch
    const userBranch = await this.prisma.userBranch.findUnique({
      where: {
        userId_branchId: { userId, branchId },
      },
    });

    if (!userBranch) {
      throw new ForbiddenException(
        'Staff member is not assigned to this branch',
      );
    }
  }
}
