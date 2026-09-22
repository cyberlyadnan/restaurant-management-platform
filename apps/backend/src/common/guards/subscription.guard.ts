import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { SessionUser } from '@nodedr-restaurant/types';
import { EntitlementService } from '../services/entitlement.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly entitlement: EntitlementService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & { user?: SessionUser }
    >();

    // If unauthenticated or no user, let AuthGuard handle it
    if (!request.user || !request.user.restaurantId) {
      return true;
    }

    // Safe read methods are allowed even if expired (read-only mode)
    const method = request.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    // Mutations require active subscription
    await this.entitlement.assertActiveSubscription(request.user.restaurantId);
    return true;
  }
}
