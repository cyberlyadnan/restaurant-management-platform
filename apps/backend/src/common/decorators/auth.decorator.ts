import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';
import type { PermissionKey } from '@nodedr-restaurant/types';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { SubscriptionGuard } from '../guards/subscription.guard';
import { RequirePermission } from './permissions.decorator';

// Combines "must be logged in" + "active subscription" + "must hold these permissions"
export const Auth = (...permissions: PermissionKey[]) =>
  applyDecorators(
    UseGuards(JwtAuthGuard, SubscriptionGuard, PermissionsGuard),
    RequirePermission(...permissions),
    ApiCookieAuth(),
  );
