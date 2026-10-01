import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { CartItemDto } from '@nodedr-restaurant/types';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';

export interface QrTableSessionPayload {
  type: 'table_qr_session';
  restaurantId: string;
  branchId: string;
  tableId: string;
  qrToken: string;
}

@Injectable()
export class PublicMenuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly jwt: JwtService,
  ) {}

  private async resolveTable(qrToken: string) {
    const table = await this.prisma.table.findUnique({
      where: { qrToken },
      include: { floor: { include: { branch: true } } },
    });
    if (!table) throw new NotFoundException('This QR code is not recognized');
    return table;
  }

  async getMenuByQrToken(qrToken: string) {
    const table = await this.resolveTable(qrToken);
    const branch = table.floor.branch;

    const categories = await this.prisma.menuCategory.findMany({
      where: { branchId: branch.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            price: true,
            isVeg: true,
            isVegan: true,
            spiceLevel: true,
            allergens: true,
          },
        },
      },
    });

    const sessionPayload: QrTableSessionPayload = {
      type: 'table_qr_session',
      restaurantId: branch.restaurantId,
      branchId: branch.id,
      tableId: table.id,
      qrToken,
    };

    const tableSessionToken = this.jwt.sign(sessionPayload, {
      expiresIn: '2h',
    });

    return {
      branchName: branch.name,
      tableName: table.name ?? `Table ${table.number}`,
      tableId: table.id,
      branchId: branch.id,
      restaurantId: branch.restaurantId,
      tableSessionToken,
      categories,
    };
  }

  verifyTableSessionToken(
    token: string,
    expectedBranchId: string,
    expectedTableId: string,
  ): QrTableSessionPayload {
    try {
      const payload = this.jwt.verify<QrTableSessionPayload>(token);

      if (
        payload.type !== 'table_qr_session' ||
        payload.branchId !== expectedBranchId ||
        payload.tableId !== expectedTableId
      ) {
        throw new ForbiddenException(
          'Table session token mismatch or unauthorized for this table',
        );
      }
      return payload;
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new ForbiddenException('Invalid or expired table session token');
    }
  }

  async createOrder(
    qrToken: string,
    items: CartItemDto[],
    guestName: string,
    tableSessionToken?: string,
  ) {
    const table = await this.resolveTable(qrToken);
    const branchId = table.floor.branchId;

    if (tableSessionToken) {
      this.verifyTableSessionToken(tableSessionToken, branchId, table.id);
    }

    const openOrder = await this.prisma.order.findFirst({
      where: { branchId, tableId: table.id, status: 'OPEN' },
    });
    if (openOrder) {
      return this.ordersService.addItems(branchId, openOrder.id, items);
    }

    const createdById =
      table.assignedWaiterId ??
      (
        await this.prisma.userBranch.findFirst({
          where: { branchId },
          orderBy: { userId: 'asc' },
        })
      )?.userId;
    if (!createdById) {
      throw new NotFoundException(
        'This branch has no staff to receive the order',
      );
    }

    return this.ordersService.createOrder(branchId, createdById, {
      type: 'QR_ORDER',
      tableId: table.id,
      guestName,
      items,
    });
  }
}
