import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { BranchAccessService } from '../src/common/services/branch-access.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Security & Multi-Tenant Regression Test Suite (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let branchAccess: BranchAccessService;

  // Test Entities
  let planId: string;
  let restAId: string;
  let branchAId: string;
  let userAId: string;
  let tokenA: string;
  let tableAId: string;
  let orderAId: string;

  let restBId: string;
  let branchBId: string;
  let userBId: string;
  let tokenB: string;
  let tableBId: string;
  let orderBId: string;

  let platformAdminId: string;
  let platformToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    branchAccess = app.get(BranchAccessService);
    const config = app.get(ConfigService);
    const jwtSecret = config.getOrThrow<string>('JWT_SECRET');

    // 1. Ensure a Plan exists
    const plan = await prisma.plan.upsert({
      where: { slug: 'test-security-plan' },
      update: {},
      create: {
        slug: 'test-security-plan',
        name: 'Test Security Plan',
        description: 'For automated E2E testing',
        monthlyPrice: 99,
        yearlyPrice: 999,
        maxBranches: 10,
        maxUsers: 50,
        maxTables: 100,
        maxProducts: 500,
        features: ['pos', 'kds', 'inventory', 'tables', 'reports'],
      },
    });
    planId = plan.id;

    const allPerms = await prisma.permission.findMany();

    // 2. Seed Tenant A
    const restA = await prisma.restaurant.create({
      data: {
        name: 'Tenant Alpha Test Restaurant',
        status: 'ACTIVE',
        currency: 'USD',
        timezone: 'America/New_York',
        branches: {
          create: {
            name: 'Alpha Main Branch',
            isActive: true,
          },
        },
      },
      include: { branches: true },
    });
    restAId = restA.id;
    branchAId = restA.branches[0].id;

    // Active subscription for Tenant A
    await prisma.subscription.create({
      data: {
        restaurantId: restAId,
        planId: planId,
        status: 'ACTIVE',
        billingPeriod: 'MONTHLY',
        amount: 99,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Role & User for Tenant A
    const roleA = await prisma.role.create({
      data: {
        restaurantId: restAId,
        name: 'OWNER',
        label: 'Owner',
        isSystem: true,
      },
    });
    if (allPerms.length > 0) {
      await prisma.rolePermission.createMany({
        data: allPerms.map((p) => ({ roleId: roleA.id, permissionId: p.id })),
      });
    }

    const userA = await prisma.user.create({
      data: {
        restaurantId: restAId,
        roleId: roleA.id,
        name: 'Owner Alpha',
        email: `owner.alpha.${Date.now()}@example.com`,
        passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecJ.Bv5TpvKzP2Kq.',
        isActive: true,
        branches: {
          create: {
            branchId: branchAId,
          },
        },
      },
    });
    userAId = userA.id;
    tokenA = jwt.sign({ sub: userAId }, { secret: jwtSecret });

    // Floor, Table & Order for Tenant A
    const floorA = await prisma.floor.create({
      data: {
        branchId: branchAId,
        name: 'Main Floor A',
      },
    });
    const tableA = await prisma.table.create({
      data: {
        floorId: floorA.id,
        number: 'A-101',
        capacity: 4,
      },
    });
    tableAId = tableA.id;

    const orderA = await prisma.order.create({
      data: {
        branchId: branchAId,
        orderNumber: `ORD-A-${Date.now()}`,
        status: 'OPEN',
        createdById: userAId,
        tableId: tableAId,
        totalAmount: 50.0,
      },
    });
    orderAId = orderA.id;

    // 3. Seed Tenant B
    const restB = await prisma.restaurant.create({
      data: {
        name: 'Tenant Beta Test Restaurant',
        status: 'ACTIVE',
        currency: 'USD',
        timezone: 'America/New_York',
        branches: {
          create: {
            name: 'Beta Main Branch',
            isActive: true,
          },
        },
      },
      include: { branches: true },
    });
    restBId = restB.id;
    branchBId = restB.branches[0].id;

    // Active subscription for Tenant B
    await prisma.subscription.create({
      data: {
        restaurantId: restBId,
        planId: planId,
        status: 'ACTIVE',
        billingPeriod: 'MONTHLY',
        amount: 99,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const roleB = await prisma.role.create({
      data: {
        restaurantId: restBId,
        name: 'OWNER',
        label: 'Owner',
        isSystem: true,
      },
    });
    if (allPerms.length > 0) {
      await prisma.rolePermission.createMany({
        data: allPerms.map((p) => ({ roleId: roleB.id, permissionId: p.id })),
      });
    }

    const userB = await prisma.user.create({
      data: {
        restaurantId: restBId,
        roleId: roleB.id,
        name: 'Owner Beta',
        email: `owner.beta.${Date.now()}@example.com`,
        passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecJ.Bv5TpvKzP2Kq.',
        isActive: true,
        branches: {
          create: {
            branchId: branchBId,
          },
        },
      },
    });
    userBId = userB.id;
    tokenB = jwt.sign({ sub: userBId }, { secret: jwtSecret });

    const floorB = await prisma.floor.create({
      data: {
        branchId: branchBId,
        name: 'Main Floor B',
      },
    });
    const tableB = await prisma.table.create({
      data: {
        floorId: floorB.id,
        number: 'B-201',
        capacity: 2,
      },
    });
    tableBId = tableB.id;

    const orderB = await prisma.order.create({
      data: {
        branchId: branchBId,
        orderNumber: `ORD-B-${Date.now()}`,
        status: 'OPEN',
        createdById: userBId,
        tableId: tableBId,
        totalAmount: 120.0,
      },
    });
    orderBId = orderB.id;

    // 4. Seed Platform Admin User
    const platformAdmin = await prisma.platformUser.create({
      data: {
        name: 'Test Super Admin',
        email: `platform.admin.${Date.now()}@platform.local`,
        passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecJ.Bv5TpvKzP2Kq.',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    platformAdminId = platformAdmin.id;
    platformToken = jwt.sign(
      { sub: platformAdminId, isPlatform: true },
      { secret: jwtSecret },
    );
  }, 30000);

  afterAll(async () => {
    // Cleanup seeded test fixtures
    try {
      if (restAId) {
        await prisma.order.deleteMany({ where: { branchId: branchAId } });
        await prisma.table.deleteMany({ where: { floor: { branchId: branchAId } } });
        await prisma.floor.deleteMany({ where: { branchId: branchAId } });
        await prisma.restaurant.delete({ where: { id: restAId } });
      }
      if (restBId) {
        await prisma.order.deleteMany({ where: { branchId: branchBId } });
        await prisma.table.deleteMany({ where: { floor: { branchId: branchBId } } });
        await prisma.floor.deleteMany({ where: { branchId: branchBId } });
        await prisma.restaurant.delete({ where: { id: restBId } });
      }
      if (platformAdminId) {
        await prisma.platformUser.delete({ where: { id: platformAdminId } });
      }
      if (planId) {
        await prisma.plan.delete({ where: { id: planId } });
      }
    } catch {
      // ignore cleanup errors in test
    }
    await app.close();
  });

  // =========================================================================
  // 1. Cross-Tenant Data Isolation Tests
  // =========================================================================
  describe('Assertion 1: Cross-Tenant Data Isolation', () => {
    it('should NOT allow Restaurant A to read Restaurant B order (returns 404)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderBId}?branchId=${branchAId}`)
        .set('Cookie', `nodedr_session=${tokenA}`);

      expect(res.status).toBe(404);
    });

    it('should NOT allow Restaurant A to query using Restaurant B branchId (returns 403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tables/floors?branchId=${branchBId}`)
        .set('Cookie', `nodedr_session=${tokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Branch not found or not accessible/i);
    });
  });

  // =========================================================================
  // 2. Tenant Owner Denied Platform Backup / Restore
  // =========================================================================
  describe('Assertion 2: Restaurant Owner Denied Platform Backup / Restore', () => {
    it('should reject POST /api/v1/backups/restore with 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/backups/test-backup-id/restore')
        .set('Cookie', `nodedr_session=${tokenA}`)
        .send({ confirm: 'RESTORE_DATABASE' });

      expect(res.status).toBe(404);
    });

    it('should reject GET /api/v1/backups with 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/backups')
        .set('Cookie', `nodedr_session=${tokenA}`);

      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // 3. Restaurant Owner Denied System Update
  // =========================================================================
  describe('Assertion 3: Restaurant Owner Denied System Update', () => {
    it('should reject POST /api/v1/system/update/apply with 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/system/update/apply')
        .set('Cookie', `nodedr_session=${tokenA}`)
        .send({});

      expect(res.status).toBe(404);
    });

    it('should reject GET /api/v1/system/update/check with 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/system/update/check')
        .set('Cookie', `nodedr_session=${tokenA}`);

      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // 4. Docker / Infrastructure Isolation Verification
  // =========================================================================
  describe('Assertion 4: Docker & Infrastructure Isolation', () => {
    it('should verify that host update controller is decommissioned from the route tree', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/system/update')
        .set('Cookie', `nodedr_session=${tokenA}`)
        .send({});

      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // 5. Cross-Tenant WebSocket Room Isolation
  // =========================================================================
  describe('Assertion 5: Cross-Tenant WebSocket Room Isolation', () => {
    it('should throw ForbiddenException if Tenant A tries to join Tenant B branch room', async () => {
      await expect(
        branchAccess.assertAccess(restAId, branchBId),
      ).rejects.toThrow(/Branch not found or not accessible/i);
    });

    it('should succeed when Tenant A accesses their own branch room', async () => {
      await expect(
        branchAccess.assertAccess(restAId, branchAId),
      ).resolves.not.toThrow();
    });
  });

  // =========================================================================
  // 6. Cross-Tenant IDOR Mutation Blocked
  // =========================================================================
  describe('Assertion 6: Cross-Tenant IDOR Mutation Blocked', () => {
    it('should NOT allow Restaurant A to cancel Restaurant B order (returns 404)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderBId}/cancel?branchId=${branchAId}`)
        .set('Cookie', `nodedr_session=${tokenA}`);

      expect(res.status).toBe(404);
    });

    it('should NOT allow Restaurant A to update Restaurant B table (returns 404)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/tables/${tableBId}?branchId=${branchAId}`)
        .set('Cookie', `nodedr_session=${tokenA}`)
        .send({ number: 'HACKED-999' });

      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // 7. Expired / Suspended Subscription Restrictions
  // =========================================================================
  describe('Assertion 7: Subscription Suspension Restrictions', () => {
    it('should block mutations with 402/403 when subscription is SUSPENDED', async () => {
      // Suspend Tenant A
      await prisma.restaurant.update({
        where: { id: restAId },
        data: { status: 'SUSPENDED' },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/tables/floors?branchId=${branchAId}`)
        .set('Cookie', `nodedr_session=${tokenA}`)
        .send({
          name: 'Suspended Floor Test',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('SUBSCRIPTION_SUSPENDED');

      // Restore Tenant A to ACTIVE
      await prisma.restaurant.update({
        where: { id: restAId },
        data: { status: 'ACTIVE' },
      });
    });
  });

  // =========================================================================
  // 8. Platform Admin Privileges Verified
  // =========================================================================
  describe('Assertion 8: Platform Admin Privileges', () => {
    it('should allow Platform Admin to access platform restaurant management', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/platform/restaurants')
        .set('Cookie', `platform_session=${platformToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject normal tenant token from accessing platform admin API (returns 401)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/platform/restaurants')
        .set('Cookie', `nodedr_session=${tokenA}`);

      expect(res.status).toBe(401);
    });
  });
});
