import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Register Shifts & Cash Drawer Management (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  // Tenant A
  let restAId: string;
  let branchAId: string;
  let userAId: string;
  let tokenA: string;
  let categoryAId: string;
  let menuItemAId: string;

  // Tenant B
  let restBId: string;
  let branchBId: string;
  let userBId: string;
  let tokenB: string;

  let shiftAId: string;

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
    const config = app.get(ConfigService);
    const jwtSecret = config.getOrThrow<string>('JWT_SECRET');

    const allPerms = await prisma.permission.findMany();

    // Plan
    const plan = await prisma.plan.upsert({
      where: { slug: 'test-shift-plan' },
      update: {},
      create: {
        slug: 'test-shift-plan',
        name: 'Test Shift Plan',
        monthlyPrice: 99,
        yearlyPrice: 999,
        maxBranches: 10,
        maxUsers: 50,
        maxTables: 100,
        maxProducts: 500,
        features: ['pos', 'kds', 'cash_drawer'],
      },
    });

    // Tenant A
    const restA = await prisma.restaurant.create({
      data: {
        name: 'Shift Restaurant A',
        status: 'ACTIVE',
        currency: 'USD',
        timezone: 'America/New_York',
        branches: {
          create: {
            name: 'Shift Branch A',
            isActive: true,
          },
        },
      },
      include: { branches: true },
    });
    restAId = restA.id;
    branchAId = restA.branches[0].id;

    await prisma.subscription.create({
      data: {
        restaurantId: restAId,
        planId: plan.id,
        status: 'ACTIVE',
        billingPeriod: 'MONTHLY',
        amount: 99,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

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
        name: 'Owner A',
        email: `shift.owner.a.${Date.now()}@example.com`,
        passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecJ.Bv5TpvKzP2Kq.',
        isActive: true,
        branches: {
          create: { branchId: branchAId },
        },
      },
    });
    userAId = userA.id;
    tokenA = jwt.sign({ sub: userAId }, { secret: jwtSecret });

    const catA = await prisma.menuCategory.create({
      data: {
        branchId: branchAId,
        name: 'Test Category',
      },
    });
    categoryAId = catA.id;

    const itemA = await prisma.menuItem.create({
      data: {
        branchId: branchAId,
        categoryId: categoryAId,
        name: 'Test Pizza',
        price: 45.0,
      },
    });
    menuItemAId = itemA.id;

    // Tenant B
    const restB = await prisma.restaurant.create({
      data: {
        name: 'Shift Restaurant B',
        status: 'ACTIVE',
        currency: 'USD',
        timezone: 'America/New_York',
        branches: {
          create: {
            name: 'Shift Branch B',
            isActive: true,
          },
        },
      },
      include: { branches: true },
    });
    restBId = restB.id;
    branchBId = restB.branches[0].id;

    await prisma.subscription.create({
      data: {
        restaurantId: restBId,
        planId: plan.id,
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
        name: 'Owner B',
        email: `shift.owner.b.${Date.now()}@example.com`,
        passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecJ.Bv5TpvKzP2Kq.',
        isActive: true,
        branches: {
          create: { branchId: branchBId },
        },
      },
    });
    userBId = userB.id;
    tokenB = jwt.sign({ sub: userBId }, { secret: jwtSecret });
  });

  afterAll(async () => {
    const branchIds = [branchAId, branchBId].filter(Boolean);
    const restIds = [restAId, restBId].filter(Boolean);
    const userIds = [userAId, userBId].filter(Boolean);

    if (branchIds.length > 0) {
      await prisma.shiftCashMovement.deleteMany({
        where: { shift: { branchId: { in: branchIds } } },
      });
      await prisma.registerShift.deleteMany({
        where: { branchId: { in: branchIds } },
      });
      await prisma.payment.deleteMany({
        where: { order: { branchId: { in: branchIds } } },
      });
      await prisma.refund.deleteMany({
        where: { order: { branchId: { in: branchIds } } },
      });
      await prisma.orderItem.deleteMany({
        where: { order: { branchId: { in: branchIds } } },
      });
      await prisma.order.deleteMany({
        where: { branchId: { in: branchIds } },
      });
      await prisma.menuItem.deleteMany({
        where: { branchId: { in: branchIds } },
      });
      await prisma.menuCategory.deleteMany({
        where: { branchId: { in: branchIds } },
      });
      await prisma.userBranch.deleteMany({
        where: { branchId: { in: branchIds } },
      });
    }
    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }
    if (restIds.length > 0) {
      await prisma.rolePermission.deleteMany({
        where: { role: { restaurantId: { in: restIds } } },
      });
      await prisma.role.deleteMany({
        where: { restaurantId: { in: restIds } },
      });
      await prisma.subscription.deleteMany({
        where: { restaurantId: { in: restIds } },
      });
      await prisma.branch.deleteMany({
        where: { id: { in: branchIds } },
      });
      await prisma.restaurant.deleteMany({
        where: { id: { in: restIds } },
      });
    }
    await app.close();
  });

  it('1. GET /api/v1/shifts/current returns empty or null when no shift is open', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/shifts/current?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .expect(200);

    expect(!res.body || Object.keys(res.body).length === 0).toBe(true);
  });

  it('2. POST /api/v1/shifts/open opens a new register shift with starting cash float', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/shifts/open?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .send({
        startingCash: 200.0,
        notes: 'Morning shift opening float',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('OPEN');
    expect(Number(res.body.startingCash)).toBe(200.0);
    expect(Number(res.body.expectedCash)).toBe(200.0);
    shiftAId = res.body.id;
  });

  it('3. POST /api/v1/shifts/open rejects opening a second shift when one is active', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/shifts/open?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .send({
        startingCash: 100.0,
      })
      .expect(400);

    expect(res.body.message).toContain('already open');
  });

  it('4. POST /api/v1/shifts/:id/movements records PAID_IN and PAID_OUT', async () => {
    // Record PAID_IN (add 50)
    await request(app.getHttpServer())
      .post(`/api/v1/shifts/${shiftAId}/movements?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .send({
        type: 'PAID_IN',
        amount: 50.0,
        reason: 'Change from bank',
      })
      .expect(201);

    // Record PAID_OUT (payout 20 for supplies)
    await request(app.getHttpServer())
      .post(`/api/v1/shifts/${shiftAId}/movements?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .send({
        type: 'PAID_OUT',
        amount: 20.0,
        reason: 'Office supplies',
      })
      .expect(201);

    // Verify current shift expected cash = 200 + 50 - 20 = 230
    const curRes = await request(app.getHttpServer())
      .get(`/api/v1/shifts/current?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .expect(200);

    expect(Number(curRes.body.paidIn)).toBe(50.0);
    expect(Number(curRes.body.paidOut)).toBe(20.0);
    expect(Number(curRes.body.expectedCash)).toBe(230.0);
  });

  it('5. Order checkout automatically updates active shift cash totals', async () => {
    // Create an order with OrderItem for branch A
    const order = await prisma.order.create({
      data: {
        branchId: branchAId,
        orderNumber: 'TEST-SHIFT-001',
        type: 'TAKEAWAY',
        status: 'OPEN',
        totalAmount: 45.0,
        createdById: userAId,
        items: {
          create: {
            menuItemId: menuItemAId,
            nameSnapshot: 'Test Pizza',
            unitPriceSnapshot: 45.0,
            taxRateSnapshot: 0,
            quantity: 1,
            lineTotal: 45.0,
          },
        },
      },
    });

    // Checkout order with $45 CASH
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${order.id}/checkout?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .send({
        payments: [{ method: 'CASH', amount: 45.0 }],
      })
      .expect(201);

    // Verify shift cashSales = 45 and expectedCash = 230 + 45 = 275
    const curRes = await request(app.getHttpServer())
      .get(`/api/v1/shifts/current?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .expect(200);

    expect(Number(curRes.body.cashSales)).toBe(45.0);
    expect(Number(curRes.body.expectedCash)).toBe(275.0);
  });

  it('6. Order refund automatically adjusts active shift cash totals', async () => {
    // Find the paid order from step 5
    const order = await prisma.order.findFirstOrThrow({
      where: { orderNumber: 'TEST-SHIFT-001', branchId: branchAId },
    });

    // Refund $15 in CASH
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${order.id}/refund?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .send({
        amount: 15.0,
        reason: 'Customer complaint',
        method: 'CASH',
      })
      .expect(201);

    // Verify shift cashRefunds = 15 and expectedCash = 275 - 15 = 260
    const curRes = await request(app.getHttpServer())
      .get(`/api/v1/shifts/current?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .expect(200);

    expect(Number(curRes.body.cashRefunds)).toBe(15.0);
    expect(Number(curRes.body.expectedCash)).toBe(260.0);
  });

  it('7. GET /api/v1/shifts/:id/x-report generates mid-shift summary', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/shifts/${shiftAId}/x-report?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .expect(200);

    expect(res.body.shiftId).toBe(shiftAId);
    expect(res.body.reportType).toBe('X_REPORT');
    expect(res.body.startingCash).toBe(200.0);
    expect(res.body.tenderBreakdown.cash).toBe(45.0);
    expect(res.body.cashRefunds).toBe(15.0);
    expect(res.body.paidIn).toBe(50.0);
    expect(res.body.paidOut).toBe(20.0);
    expect(res.body.expectedCashInDrawer).toBe(260.0);
    expect(res.body.movements.length).toBe(2);
  });

  it('8. POST /api/v1/shifts/:id/close performs blind count and generates Z-report with variance', async () => {
    // Expected cash is 260. Cashier counts 255 (short by $5)
    const res = await request(app.getHttpServer())
      .post(`/api/v1/shifts/${shiftAId}/close?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .send({
        actualCash: 255.0,
        notes: 'Small shortage at closing register count',
      })
      .expect(201);

    expect(res.body.reportType).toBe('Z_REPORT');
    expect(res.body.actualCashCounted).toBe(255.0);
    expect(res.body.cashDifference).toBe(-5.0);

    // Current shift should now be null/empty
    const curRes = await request(app.getHttpServer())
      .get(`/api/v1/shifts/current?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .expect(200);

    expect(!curRes.body || Object.keys(curRes.body).length === 0).toBe(true);
  });

  it('9. Multi-Tenant Isolation: Tenant B cannot access or close Tenant A shifts', async () => {
    // Tenant B tries to get X-Report of Tenant A's shift
    await request(app.getHttpServer())
      .get(`/api/v1/shifts/${shiftAId}/x-report?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenB}`)
      .expect(403);

    // Tenant B tries to access via their own branchId (shift not found in tenant B)
    await request(app.getHttpServer())
      .get(`/api/v1/shifts/${shiftAId}/x-report?branchId=${branchBId}`)
      .set('Cookie', `nodedr_session=${tokenB}`)
      .expect(404);

    // Tenant B tries to record cash movement on Tenant A's shift
    await request(app.getHttpServer())
      .post(`/api/v1/shifts/${shiftAId}/movements?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenB}`)
      .send({
        type: 'PAID_IN',
        amount: 100.0,
        reason: 'Illegal movement',
      })
      .expect(403);
  });
});
