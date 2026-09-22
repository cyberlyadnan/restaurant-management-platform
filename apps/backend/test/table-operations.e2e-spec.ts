import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Table Operations: Move, Merge & Unmerge (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  // Tenant A
  let restAId: string;
  let branchAId: string;
  let userAId: string;
  let tokenA: string;
  let floorAId: string;
  let tableA1Id: string;
  let tableA2Id: string;
  let tableA3Id: string;
  let tableA4Id: string;
  let categoryAId: string;
  let menuItemAId: string;

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
      where: { slug: 'test-tables-plan' },
      update: {},
      create: {
        slug: 'test-tables-plan',
        name: 'Test Tables Plan',
        monthlyPrice: 99,
        yearlyPrice: 999,
        maxBranches: 10,
        maxUsers: 50,
        maxTables: 100,
        maxProducts: 500,
        features: ['pos', 'tables'],
      },
    });

    // Tenant A
    const restA = await prisma.restaurant.create({
      data: {
        name: 'Table Ops Restaurant A',
        status: 'ACTIVE',
        currency: 'USD',
        timezone: 'America/New_York',
        branches: {
          create: {
            name: 'Table Ops Branch A',
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
        endDate: new Date(Date.now() + 30 * 86400000),
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
        email: `table-ops-a-${Date.now()}@example.com`,
        passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecJ.Bv5TpvKzP2Kq.',
        name: 'Host A',
        isActive: true,
        branches: { create: { branchId: branchAId } },
      },
    });
    userAId = userA.id;
    tokenA = jwt.sign({ sub: userAId }, { secret: jwtSecret });

    // Floor and Tables for Tenant A
    const floorA = await prisma.floor.create({
      data: {
        branchId: branchAId,
        name: 'Main Dining',
        sortOrder: 1,
      },
    });
    floorAId = floorA.id;

    const t1 = await prisma.table.create({
      data: { floorId: floorAId, number: '101', capacity: 2, status: 'AVAILABLE' },
    });
    tableA1Id = t1.id;

    const t2 = await prisma.table.create({
      data: { floorId: floorAId, number: '102', capacity: 4, status: 'AVAILABLE' },
    });
    tableA2Id = t2.id;

    const t3 = await prisma.table.create({
      data: { floorId: floorAId, number: '103', capacity: 4, status: 'AVAILABLE' },
    });
    tableA3Id = t3.id;

    const t4 = await prisma.table.create({
      data: { floorId: floorAId, number: '104', capacity: 6, status: 'AVAILABLE' },
    });
    tableA4Id = t4.id;

    const catA = await prisma.menuCategory.create({
      data: { branchId: branchAId, name: 'Entrees' },
    });
    categoryAId = catA.id;

    const itemA = await prisma.menuItem.create({
      data: {
        branchId: branchAId,
        categoryId: categoryAId,
        name: 'Signature Steak',
        price: 40.0,
      },
    });
    menuItemAId = itemA.id;

    // Tenant B
    const restB = await prisma.restaurant.create({
      data: {
        name: 'Table Ops Restaurant B',
        status: 'ACTIVE',
        currency: 'USD',
        timezone: 'America/New_York',
        branches: {
          create: {
            name: 'Table Ops Branch B',
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
        endDate: new Date(Date.now() + 30 * 86400000),
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
        email: `table-ops-b-${Date.now()}@example.com`,
        passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecJ.Bv5TpvKzP2Kq.',
        name: 'Host B',
        isActive: true,
        branches: { create: { branchId: branchBId } },
      },
    });
    userBId = userB.id;
    tokenB = jwt.sign({ sub: userBId }, { secret: jwtSecret });
  });

  afterAll(async () => {
    const branchIds = [branchAId, branchBId].filter(Boolean);
    const restIds = [restAId, restBId].filter(Boolean);
    const userIds = [userAId, userBId].filter(Boolean);

    await prisma.payment.deleteMany({
      where: { order: { branchId: { in: branchIds } } },
    });
    await prisma.kot.deleteMany({
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
      where: { category: { branchId: { in: branchIds } } },
    });
    await prisma.menuCategory.deleteMany({
      where: { branchId: { in: branchIds } },
    });
    await prisma.userBranch.deleteMany({
      where: { branchId: { in: branchIds } },
    });
    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }
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

    await app.close();
  });

  it('1. Move table: Transfers an active dining party & order from Table 101 to Table 102', async () => {
    // 1. Create an order on Table 101 (sets Table 101 to OCCUPIED)
    const orderRes = await request(app.getHttpServer())
      .post(`/api/v1/orders?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .send({
        tableId: tableA1Id,
        orderType: 'DINE_IN',
        items: [{ menuItemId: menuItemAId, quantity: 2 }],
      })
      .expect(201);

    const orderId = orderRes.body.id;
    expect(orderRes.body.tableId).toBe(tableA1Id);

    // Verify Table 101 is OCCUPIED
    const t1Before = await prisma.table.findUnique({ where: { id: tableA1Id } });
    expect(t1Before?.status).toBe('OCCUPIED');

    // 2. Move Table 101 to Table 102
    const moveRes = await request(app.getHttpServer())
      .post(`/api/v1/tables/${tableA1Id}/move?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .send({ targetTableId: tableA2Id })
      .expect(201);

    expect(moveRes.body.orderMoved).toBe(true);
    expect(moveRes.body.sourceTable.status).toBe('AVAILABLE');
    expect(moveRes.body.targetTable.status).toBe('OCCUPIED');

    // Verify order was re-anchored to Table 102
    const movedOrder = await prisma.order.findUnique({ where: { id: orderId } });
    expect(movedOrder?.tableId).toBe(tableA2Id);

    // Verify database state directly
    const [t1After, t2After] = await Promise.all([
      prisma.table.findUnique({ where: { id: tableA1Id } }),
      prisma.table.findUnique({ where: { id: tableA2Id } }),
    ]);
    expect(t1After?.status).toBe('AVAILABLE');
    expect(t2After?.status).toBe('OCCUPIED');
  });

  it('2. Move table: Rejects moving to an already OCCUPIED table', async () => {
    // Table 102 is currently OCCUPIED from previous test
    // Attempting to move Table 101 into Table 102 should be rejected
    const res = await request(app.getHttpServer())
      .post(`/api/v1/tables/${tableA1Id}/move?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .send({ targetTableId: tableA2Id })
      .expect(400);

    expect(res.body.message).toContain('is not available');
  });

  it('3. Merge tables: Consolidates Table 103 into Table 104 and merges active orders', async () => {
    // Create order on Table 103 (1 steak = $40)
    const order3Res = await request(app.getHttpServer())
      .post(`/api/v1/orders?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .send({
        tableId: tableA3Id,
        orderType: 'DINE_IN',
        items: [{ menuItemId: menuItemAId, quantity: 1 }],
      })
      .expect(201);
    const order3Id = order3Res.body.id;

    // Create order on Table 104 (2 steaks = $80)
    const order4Res = await request(app.getHttpServer())
      .post(`/api/v1/orders?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .send({
        tableId: tableA4Id,
        orderType: 'DINE_IN',
        items: [{ menuItemId: menuItemAId, quantity: 2 }],
      })
      .expect(201);
    const order4Id = order4Res.body.id;

    // Merge Table 103 (secondary) into Table 104 (primary)
    const mergeRes = await request(app.getHttpServer())
      .post(`/api/v1/tables/${tableA3Id}/merge?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .send({ targetTableId: tableA4Id })
      .expect(201);

    expect(mergeRes.body.primaryTable.id).toBe(tableA4Id);
    expect(mergeRes.body.primaryTable.status).toBe('OCCUPIED');
    expect(mergeRes.body.secondaryTable.id).toBe(tableA3Id);
    expect(mergeRes.body.secondaryTable.status).toBe('OCCUPIED');
    expect(mergeRes.body.secondaryTable.mergedWithTableId).toBe(tableA4Id);

    // Verify order 3 was cancelled and merged into order 4
    const [order3, order4] = await Promise.all([
      prisma.order.findUnique({ where: { id: order3Id } }),
      prisma.order.findUnique({ where: { id: order4Id }, include: { items: true } }),
    ]);
    expect(order3?.status).toBe('CANCELLED');
    expect(order4?.items.length).toBe(2); // original items + consolidated items
    expect(Number(order4?.totalAmount)).toBe(120); // $40 + $80 = $120
  });

  it('4. Unmerge table: Releases secondary Table 103 back to AVAILABLE', async () => {
    // Unmerge Table 103
    const unmergeRes = await request(app.getHttpServer())
      .post(`/api/v1/tables/${tableA3Id}/unmerge?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .expect(201);

    expect(unmergeRes.body.unmergedTable.id).toBe(tableA3Id);
    expect(unmergeRes.body.unmergedTable.status).toBe('AVAILABLE');
    expect(unmergeRes.body.unmergedTable.mergedWithTableId).toBeNull();

    // Primary Table 104 remains OCCUPIED
    const t4 = await prisma.table.findUnique({
      where: { id: tableA4Id },
      include: { mergedTables: true },
    });
    expect(t4?.status).toBe('OCCUPIED');
    expect(t4?.mergedTables.length).toBe(0);
  });

  it('5. Coordinated Checkout Release: Settling master order on Table 104 releases both Table 104 & merged Table 103 together', async () => {
    // 1. Re-merge Table 103 into Table 104
    await request(app.getHttpServer())
      .post(`/api/v1/tables/${tableA3Id}/merge?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .send({ targetTableId: tableA4Id })
      .expect(201);

    // 2. Query open order on Table 104
    const order4 = await prisma.order.findFirst({
      where: { tableId: tableA4Id, status: 'OPEN' },
    });
    expect(order4).toBeDefined();

    // 3. Checkout master order in full
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${order4!.id}/checkout?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenA}`)
      .send({
        payments: [{ method: 'CARD', amount: Number(order4!.totalAmount) }],
      })
      .expect(201);

    // 4. Verify both Table 104 and secondary merged Table 103 are released to AVAILABLE!
    const [t4After, t3After] = await Promise.all([
      prisma.table.findUnique({ where: { id: tableA4Id } }),
      prisma.table.findUnique({ where: { id: tableA3Id } }),
    ]);

    expect(t4After?.status).toBe('AVAILABLE');
    expect(t3After?.status).toBe('AVAILABLE');
    expect(t3After?.mergedWithTableId).toBeNull();
  });

  it('6. Multi-Tenant Isolation: Tenant B cannot move or merge Tenant A tables', async () => {
    // Tenant B attempts to move Tenant A table with Tenant A branch -> 403 Forbidden
    await request(app.getHttpServer())
      .post(`/api/v1/tables/${tableA1Id}/move?branchId=${branchAId}`)
      .set('Cookie', `nodedr_session=${tokenB}`)
      .send({ targetTableId: tableA2Id })
      .expect(403);

    // Tenant B attempts to merge Tenant A table with Tenant B branch -> 404 Not Found
    await request(app.getHttpServer())
      .post(`/api/v1/tables/${tableA1Id}/merge?branchId=${branchBId}`)
      .set('Cookie', `nodedr_session=${tokenB}`)
      .send({ targetTableId: tableA2Id })
      .expect(404);
  });
});
