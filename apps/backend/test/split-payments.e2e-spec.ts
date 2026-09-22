import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Bill Splitting & Multi-Payer Checkout (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  // Tenant A
  let restAId: string;
  let branchAId: string;
  let userAId: string;
  let tokenA: string;
  let tableAId: string;
  let categoryAId: string;
  let menuItemAId: string;
  let shiftAId: string;

  // Tenant B
  let restBId: string;
  let branchBId: string;
  let userBId: string;
  let tokenB: string;

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
      where: { slug: 'test-split-plan' },
      update: {},
      create: {
        slug: 'test-split-plan',
        name: 'Test Split Plan',
        monthlyPrice: 99,
        yearlyPrice: 999,
        maxBranches: 10,
        maxUsers: 50,
        maxTables: 100,
        maxProducts: 500,
        features: ['pos', 'cash_drawer', 'tables'],
      },
    });

    // Tenant A
    const restA = await prisma.restaurant.create({
      data: {
        name: 'Split Restaurant A',
        status: 'ACTIVE',
        currency: 'USD',
        timezone: 'America/New_York',
        branches: {
          create: {
            name: 'Split Branch A',
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
        name: 'Owner Split A',
        email: `split.owner.a.${Date.now()}@example.com`,
        passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecJ.Bv5TpvKzP2Kq.',
        isActive: true,
        branches: {
          create: { branchId: branchAId },
        },
      },
    });
    userAId = userA.id;
    tokenA = jwt.sign({ sub: userAId }, { secret: jwtSecret });

    const floorA = await prisma.floor.create({
      data: {
        branchId: branchAId,
        name: 'Main Floor',
        tables: {
          create: {
            number: '10',
            capacity: 4,
            status: 'AVAILABLE',
          },
        },
      },
      include: { tables: true },
    });
    tableAId = floorA.tables[0].id;

    const catA = await prisma.menuCategory.create({
      data: {
        branchId: branchAId,
        name: 'Entrees',
      },
    });
    categoryAId = catA.id;

    const itemA = await prisma.menuItem.create({
      data: {
        branchId: branchAId,
        categoryId: categoryAId,
        name: 'Gourmet Burger',
        price: 20.0,
      },
    });
    menuItemAId = itemA.id;

    // Open an active register shift for Branch A with starting float $100
    const shift = await prisma.registerShift.create({
      data: {
        branchId: branchAId,
        openedById: userAId,
        startingCash: 100.0,
        expectedCash: 100.0,
        status: 'OPEN',
      },
    });
    shiftAId = shift.id;

    // Tenant B
    const restB = await prisma.restaurant.create({
      data: {
        name: 'Split Restaurant B',
        status: 'ACTIVE',
        currency: 'USD',
        timezone: 'America/New_York',
        branches: {
          create: {
            name: 'Split Branch B',
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
        name: 'Owner Split B',
        email: `split.owner.b.${Date.now()}@example.com`,
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
      await prisma.orderItem.deleteMany({
        where: { order: { branchId: { in: branchIds } } },
      });
      await prisma.order.deleteMany({
        where: { branchId: { in: branchIds } },
      });
      await prisma.table.deleteMany({
        where: { floor: { branchId: { in: branchIds } } },
      });
      await prisma.floor.deleteMany({
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

  it('1. Settles multi-tender equal split in a single checkout', async () => {
    // Order total = 2x $20 = $40
    const order = await prisma.order.create({
      data: {
        branchId: branchAId,
        orderNumber: 'SPLIT-001',
        type: 'DINE_IN',
        tableId: tableAId,
        status: 'OPEN',
        totalAmount: 40.0,
        createdById: userAId,
        items: {
          create: {
            menuItemId: menuItemAId,
            nameSnapshot: 'Gourmet Burger',
            unitPriceSnapshot: 20.0,
            taxRateSnapshot: 0,
            quantity: 2,
            lineTotal: 40.0,
          },
        },
      },
    });

    // Mark table OCCUPIED
    await prisma.table.update({
      where: { id: tableAId },
      data: { status: 'OCCUPIED' },
    });

    // Split 50/50: Alice pays $20 in CASH, Bob pays $20 with CARD
    const res = await request(app.getHttpServer())
      .post(`/api/v1/orders/${order.id}/checkout?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .send({
        splitType: 'EQUAL',
        payments: [
          { method: 'CASH', amount: 20.0, payerName: 'Alice' },
          { method: 'CARD', amount: 20.0, payerName: 'Bob' },
        ],
      })
      .expect(201);

    expect(res.body.status).toBe('PAID');
    expect(res.body.payments.length).toBe(2);

    // Verify table is released to AVAILABLE
    const table = await prisma.table.findUniqueOrThrow({
      where: { id: tableAId },
    });
    expect(table.status).toBe('AVAILABLE');

    // Verify shift drawer updated: expectedCash = 100 + 20 = 120, cardSales = 20
    const shift = await prisma.registerShift.findUniqueOrThrow({
      where: { id: shiftAId },
    });
    expect(Number(shift.expectedCash)).toBe(120.0);
    expect(Number(shift.cashSales)).toBe(20.0);
    expect(Number(shift.cardSales)).toBe(20.0);
  });

  it('2. Sequential partial payments update status to PARTIALLY_PAID then PAID', async () => {
    // Order total = 3x $20 = $60
    const order = await prisma.order.create({
      data: {
        branchId: branchAId,
        orderNumber: 'SPLIT-002',
        type: 'DINE_IN',
        tableId: tableAId,
        status: 'OPEN',
        totalAmount: 60.0,
        createdById: userAId,
        items: {
          create: {
            menuItemId: menuItemAId,
            nameSnapshot: 'Gourmet Burger',
            unitPriceSnapshot: 20.0,
            taxRateSnapshot: 0,
            quantity: 3,
            lineTotal: 60.0,
          },
        },
      },
    });

    await prisma.table.update({
      where: { id: tableAId },
      data: { status: 'OCCUPIED' },
    });

    // Payer 1 (Charlie) pays partial $25 via CASH
    const partRes = await request(app.getHttpServer())
      .post(`/api/v1/orders/${order.id}/payments?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .send({
        payment: {
          method: 'CASH',
          amount: 25.0,
          payerName: 'Charlie',
        },
      })
      .expect(201);

    expect(partRes.body.order.status).toBe('PARTIALLY_PAID');
    expect(partRes.body.isFullyPaid).toBe(false);
    expect(partRes.body.remainingDue).toBe(35.0);

    // Table must still be OCCUPIED
    const tableMid = await prisma.table.findUniqueOrThrow({
      where: { id: tableAId },
    });
    expect(tableMid.status).toBe('OCCUPIED');

    // Payer 2 (Diana) settles remaining $35 via CARD
    const finalRes = await request(app.getHttpServer())
      .post(`/api/v1/orders/${order.id}/payments?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .send({
        payment: {
          method: 'CARD',
          amount: 35.0,
          payerName: 'Diana',
        },
      })
      .expect(201);

    expect(finalRes.body.order.status).toBe('PAID');
    expect(finalRes.body.isFullyPaid).toBe(true);
    expect(finalRes.body.remainingDue).toBe(0.0);

    // Table now releases to AVAILABLE
    const tableFinal = await prisma.table.findUniqueOrThrow({
      where: { id: tableAId },
    });
    expect(tableFinal.status).toBe('AVAILABLE');
  });

  it('3. Generates itemized individual split receipt for specific payer', async () => {
    // Find the paid order from step 2
    const order = await prisma.order.findFirstOrThrow({
      where: { orderNumber: 'SPLIT-002', branchId: branchAId },
      include: { payments: true },
    });

    const charliePayment = order.payments.find((p) => p.payerName === 'Charlie')!;
    expect(charliePayment).toBeDefined();

    const res = await request(app.getHttpServer())
      .get(
        `/api/v1/orders/${order.id}/split-receipt?branchId=${branchAId}&paymentId=${charliePayment.id}`,
      )
      .set('Cookie', `nodedr_session=${tokenA}`)
      .expect(200);

    expect(res.body.orderId).toBe(order.id);
    expect(res.body.payerName).toBe('Charlie');
    expect(res.body.paymentAmount).toBe(25.0);
    expect(res.body.paymentMethod).toBe('CASH');
    expect(res.body.splitInfo).toContain('Split Payment');
  });

  it('4. Multi-Tenant Isolation: Tenant B cannot make partial payments on Tenant A order', async () => {
    const order = await prisma.order.findFirstOrThrow({
      where: { orderNumber: 'SPLIT-001', branchId: branchAId },
    });

    // Tenant B attempts partial payment using Tenant A branchId
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${order.id}/payments?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenB}`)
      .send({
        payment: { method: 'CASH', amount: 10.0 },
      })
      .expect(403);

    // Tenant B attempts split receipt query using Tenant B branchId (not found)
    await request(app.getHttpServer())
      .get(`/api/v1/orders/${order.id}/split-receipt?branchId=${branchBId}&paymentId=dummy`)
      .set('Cookie', `nodedr_session=${tokenB}`)
      .expect(404);
  });
});
