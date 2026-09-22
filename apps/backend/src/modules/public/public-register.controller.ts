import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
  Res,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import * as bcrypt from 'bcrypt';
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
  publicRegisterSchema,
  STAFF_ROLES,
  type PublicRegisterDto,
  type SessionUser,
} from '@nodedr-restaurant/types';
import { PrismaService } from '../../prisma/prisma.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('public-register')
@Controller('v1/public/register')
export class PublicRegisterController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(publicRegisterSchema))
  async register(
    @Body() dto: PublicRegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('An account with this email already exists');
    }

    const plan = await this.prisma.plan.findUnique({
      where: { slug: dto.planSlug },
    });
    if (!plan) {
      throw new NotFoundException(`Plan "${dto.planSlug}" not found`);
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

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const now = new Date();
    const trialDays = plan.trialDays || 14;
    const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: {
          name: dto.restaurantName,
          status: 'TRIAL',
          ownerName: dto.ownerName,
          ownerEmail: dto.email,
          ownerPhone: dto.phone,
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
          email: dto.email,
          phone: dto.phone,
          passwordHash,
        },
        include: {
          role: {
            include: { permissions: { include: { permission: true } } },
          },
        },
      });

      await tx.userBranch.create({
        data: { userId: user.id, branchId: branch.id },
      });

      await tx.subscription.create({
        data: {
          restaurantId: restaurant.id,
          planId: plan.id,
          status: 'TRIAL',
          billingPeriod: 'MONTHLY',
          amount: Number(plan.monthlyPrice),
          currency: 'INR',
          startDate: now,
          endDate: trialEndsAt,
          trialEndsAt,
          notes: `Self-serve ${plan.name} trial registration`,
        },
      });

      return user;
    });

    const sessionUser: SessionUser = {
      id: result.id,
      restaurantId: result.restaurantId,
      name: result.name,
      roleId: result.roleId,
      roleName: result.role.name,
      permissions: result.role.permissions.map((rp) => rp.permission.key),
    };

    const token = await this.jwt.signAsync({ sub: result.id });

    res.cookie('nodedr_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return { token, user: sessionUser };
  }
}
