import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface TenantContext {
  restaurantId: string;
  name: string;
}

/**
 * Isolated tenant execution context helper for background jobs / scheduled tasks.
 * Guarantees that background job operations on restaurant-specific resources execute
 * within an explicit, isolated tenant context.
 */
@Injectable()
export class TenantContextService {
  private readonly logger = new Logger(TenantContextService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executes a task function in an explicit tenant context.
   */
  async runInTenantContext<T>(
    restaurantId: string,
    taskFn: (context: TenantContext) => Promise<T>,
  ): Promise<T> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, name: true, status: true },
    });

    if (!restaurant) {
      throw new Error(`Tenant context failed: Restaurant ${restaurantId} not found`);
    }

    const context: TenantContext = {
      restaurantId: restaurant.id,
      name: restaurant.name,
    };

    try {
      return await taskFn(context);
    } catch (error) {
      this.logger.error(
        `Error executing task in tenant context [${restaurantId}]: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Iterates through all active tenants and executes the task function independently for each tenant.
   */
  async runForAllActiveTenants<T>(
    taskFn: (context: TenantContext) => Promise<T>,
  ): Promise<Map<string, T | Error>> {
    const activeRestaurants = await this.prisma.restaurant.findMany({
      where: { status: { in: ['ACTIVE', 'TRIAL'] } },
      select: { id: true, name: true },
    });

    const results = new Map<string, T | Error>();

    for (const restaurant of activeRestaurants) {
      try {
        const res = await this.runInTenantContext(restaurant.id, taskFn);
        results.set(restaurant.id, res);
      } catch (err) {
        results.set(restaurant.id, err instanceof Error ? err : new Error(String(err)));
      }
    }

    return results;
  }
}
