import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  BulkTableCreateDto,
  FloorDto,
  FloorUpdateDto,
  TableDto,
  TableLayoutUpdateDto,
  TableStatusDto,
  TableUpdateDto,
} from '@nodedr-restaurant/types';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { computeOrderTotals, priceLine } from '../orders/pricing';

@Injectable()
export class TablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  listFloors(branchId: string) {
    return this.prisma.floor.findMany({
      where: { branchId },
      orderBy: { sortOrder: 'asc' },
      include: {
        tables: {
          include: {
            assignedWaiter: { select: { id: true, name: true } },
            mergedWithTable: {
              select: { id: true, number: true, name: true, status: true },
            },
            mergedTables: {
              select: { id: true, number: true, name: true, status: true },
            },
          },
        },
      },
    });
  }

  createFloor(branchId: string, dto: FloorDto) {
    return this.prisma.floor.create({ data: { ...dto, branchId } });
  }

  async updateFloor(branchId: string, id: string, dto: FloorUpdateDto) {
    await this.assertFloorInBranch(branchId, id);
    return this.prisma.floor.update({ where: { id }, data: dto });
  }

  async createTable(branchId: string, dto: TableDto) {
    await this.assertFloorInBranch(branchId, dto.floorId);
    const table = await this.prisma.table.create({ data: dto });
    this.realtime.emitToBranch(branchId, 'table.updated', table);
    return table;
  }

  async createTables(branchId: string, dto: BulkTableCreateDto) {
    await this.assertFloorInBranch(branchId, dto.floorId);

    const numbers = dto.numbers.map((n) => n.trim()).filter(Boolean);
    const duplicatesInBatch = numbers.filter(
      (n, i) => numbers.indexOf(n) !== i,
    );
    if (duplicatesInBatch.length > 0) {
      throw new BadRequestException(
        `Table numbers must be unique: ${[...new Set(duplicatesInBatch)].join(', ')} ${duplicatesInBatch.length > 1 ? 'are' : 'is'} repeated.`,
      );
    }

    const existing = await this.prisma.table.findMany({
      where: { floorId: dto.floorId, number: { in: numbers } },
      select: { number: true },
    });
    if (existing.length > 0) {
      const clashes = existing.map((t) => t.number).join(', ');
      throw new BadRequestException(
        `These table numbers already exist on this floor: ${clashes}. Choose different numbers.`,
      );
    }

    const tables = await this.prisma.$transaction(
      numbers.map((number, index) =>
        this.prisma.table.create({
          data: {
            floorId: dto.floorId,
            number,
            capacity: dto.capacity,
            shape: dto.shape,
            color: dto.color,
            posX: 20 + (index % 5) * 100,
            posY: 20 + Math.floor(index / 5) * 100,
          },
        }),
      ),
    );
    tables.forEach((table) =>
      this.realtime.emitToBranch(branchId, 'table.updated', table),
    );
    return tables;
  }

  async updateTable(branchId: string, id: string, dto: TableUpdateDto) {
    await this.assertTableInBranch(branchId, id);
    const table = await this.prisma.table.update({ where: { id }, data: dto });
    this.realtime.emitToBranch(branchId, 'table.updated', table);
    return table;
  }

  async updateTableLayout(branchId: string, updates: TableLayoutUpdateDto[]) {
    const owned = await this.prisma.table.findMany({
      where: { id: { in: updates.map((u) => u.id) }, floor: { branchId } },
      select: { id: true },
    });
    if (owned.length !== updates.length) {
      throw new BadRequestException(
        'One or more tables are invalid for this branch',
      );
    }

    const results = await this.prisma.$transaction(
      updates.map(({ id, ...rest }) =>
        this.prisma.table.update({ where: { id }, data: rest }),
      ),
    );
    this.realtime.emitToBranch(branchId, 'table.layout.updated', results);
    return results;
  }

  async updateTableStatus(
    branchId: string,
    id: string,
    status: TableStatusDto,
    assignedWaiterId?: string,
  ) {
    await this.assertTableInBranch(branchId, id);
    const table = await this.prisma.table.update({
      where: { id },
      data: { status, statusSince: new Date(), ...(assignedWaiterId ? { assignedWaiterId } : {}) },
    });
    this.realtime.emitToBranch(branchId, 'table.updated', table);
    return table;
  }

  async deleteTable(branchId: string, id: string) {
    await this.assertTableInBranch(branchId, id);
    await this.prisma.table.delete({ where: { id } });
    this.realtime.emitToBranch(branchId, 'table.deleted', { id });
    return { ok: true };
  }

  async rotateQrToken(branchId: string, id: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, floor: { branchId } },
    });
    if (!table) throw new NotFoundException('Table not found');

    // opaque, unguessable token — not the table's own id, so a leaked QR
    // image can't be used to enumerate other tables' ids/data
    const qrToken = randomBytes(16).toString('hex');
    return this.prisma.table.update({ where: { id }, data: { qrToken } });
  }

  async getTable(branchId: string, id: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, floor: { branchId } },
      include: {
        assignedWaiter: { select: { id: true, name: true } },
        mergedWithTable: {
          select: { id: true, number: true, name: true, status: true },
        },
        mergedTables: {
          select: { id: true, number: true, name: true, status: true },
        },
      },
    });
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async moveTable(
    branchId: string,
    sourceTableId: string,
    targetTableId: string,
  ) {
    if (sourceTableId === targetTableId) {
      throw new BadRequestException('Cannot move a table to itself');
    }

    const [sourceTable, targetTable] = await Promise.all([
      this.prisma.table.findFirst({
        where: { id: sourceTableId, floor: { branchId } },
      }),
      this.prisma.table.findFirst({
        where: { id: targetTableId, floor: { branchId } },
      }),
    ]);

    if (!sourceTable) throw new NotFoundException('Source table not found');
    if (!targetTable) throw new NotFoundException('Target table not found');

    if (targetTable.status !== 'AVAILABLE') {
      throw new BadRequestException(
        `Target table ${targetTable.name ?? targetTable.number} is not available (status: ${targetTable.status})`,
      );
    }

    // Find any open or partially paid order currently anchored on sourceTable
    const activeOrder = await this.prisma.order.findFirst({
      where: {
        branchId,
        tableId: sourceTableId,
        status: { in: ['OPEN', 'PARTIALLY_PAID'] },
      },
    });

    const { updatedSource, updatedTarget } = await this.prisma.$transaction(
      async (tx) => {
        if (activeOrder) {
          await tx.order.update({
            where: { id: activeOrder.id },
            data: { tableId: targetTableId },
          });
        }

        // If source table had secondary tables merged into it, re-point them to targetTable
        await tx.table.updateMany({
          where: { mergedWithTableId: sourceTableId },
          data: { mergedWithTableId: targetTableId },
        });

        const s = await tx.table.update({
          where: { id: sourceTableId },
          data: {
            status: 'AVAILABLE',
            statusSince: new Date(),
            mergedWithTableId: null,
          },
          include: {
            mergedWithTable: {
              select: { id: true, number: true, name: true, status: true },
            },
            mergedTables: {
              select: { id: true, number: true, name: true, status: true },
            },
          },
        });

        const t = await tx.table.update({
          where: { id: targetTableId },
          data: {
            status:
              activeOrder || sourceTable.status === 'OCCUPIED'
                ? 'OCCUPIED'
                : 'AVAILABLE',
            statusSince: new Date(),
          },
          include: {
            mergedWithTable: {
              select: { id: true, number: true, name: true, status: true },
            },
            mergedTables: {
              select: { id: true, number: true, name: true, status: true },
            },
          },
        });

        return { updatedSource: s, updatedTarget: t };
      },
    );

    this.realtime.emitToBranch(branchId, 'table.updated', updatedSource);
    this.realtime.emitToBranch(branchId, 'table.updated', updatedTarget);
    if (activeOrder) {
      this.realtime.emitToBranch(branchId, 'order.updated', {
        id: activeOrder.id,
        tableId: targetTableId,
      });
    }

    return {
      sourceTable: updatedSource,
      targetTable: updatedTarget,
      orderMoved: !!activeOrder,
    };
  }

  async mergeTables(
    branchId: string,
    primaryTableId: string,
    secondaryTableId: string,
  ) {
    if (primaryTableId === secondaryTableId) {
      throw new BadRequestException('Cannot merge a table into itself');
    }

    const [primaryTable, secondaryTable] = await Promise.all([
      this.prisma.table.findFirst({
        where: { id: primaryTableId, floor: { branchId } },
      }),
      this.prisma.table.findFirst({
        where: { id: secondaryTableId, floor: { branchId } },
      }),
    ]);

    if (!primaryTable) throw new NotFoundException('Primary table not found');
    if (!secondaryTable)
      throw new NotFoundException('Secondary table not found');

    if (secondaryTable.mergedWithTableId) {
      throw new BadRequestException(
        `Table ${secondaryTable.name ?? secondaryTable.number} is already merged with another table`,
      );
    }
    if (primaryTable.mergedWithTableId) {
      throw new BadRequestException(
        `Table ${primaryTable.name ?? primaryTable.number} is a secondary merged table. Merge into the master table instead.`,
      );
    }

    const [primaryOrder, secondaryOrder] = await Promise.all([
      this.prisma.order.findFirst({
        where: {
          branchId,
          tableId: primaryTableId,
          status: { in: ['OPEN', 'PARTIALLY_PAID'] },
        },
      }),
      this.prisma.order.findFirst({
        where: {
          branchId,
          tableId: secondaryTableId,
          status: { in: ['OPEN', 'PARTIALLY_PAID'] },
        },
      }),
    ]);

    const { updatedPrimary, updatedSecondary } = await this.prisma.$transaction(
      async (tx) => {
        // If both tables have open orders, consolidate items into primaryOrder
        if (
          primaryOrder &&
          secondaryOrder &&
          primaryOrder.id !== secondaryOrder.id
        ) {
          await tx.orderItem.updateMany({
            where: { orderId: secondaryOrder.id },
            data: { orderId: primaryOrder.id },
          });
          await tx.kot.updateMany({
            where: { orderId: secondaryOrder.id },
            data: { orderId: primaryOrder.id },
          });

          const items = await tx.orderItem.findMany({
            where: { orderId: primaryOrder.id },
          });
          const lines = items.map((item) =>
            priceLine({
              quantity: item.quantity,
              unitPriceInclusive: Number(item.lineTotal) / item.quantity,
              taxRatePercent: Number(item.taxRateSnapshot),
            }),
          );
          const totals = computeOrderTotals(lines);

          await tx.order.update({
            where: { id: primaryOrder.id },
            data: {
              subtotal: totals.subtotal,
              taxAmount: totals.taxAmount,
              totalAmount: totals.subtotal,
            },
          });

          await tx.order.update({
            where: { id: secondaryOrder.id },
            data: {
              status: 'CANCELLED',
              notes: `Merged into Table ${primaryTable.number} (order #${primaryOrder.orderNumber})`,
            },
          });
        } else if (!primaryOrder && secondaryOrder) {
          // If only secondary table had an order, reassign it to primaryTable
          await tx.order.update({
            where: { id: secondaryOrder.id },
            data: { tableId: primaryTableId },
          });
        }

        const p = await tx.table.update({
          where: { id: primaryTableId },
          data: {
            status: 'OCCUPIED',
            statusSince: new Date(),
          },
          include: {
            mergedWithTable: {
              select: { id: true, number: true, name: true, status: true },
            },
            mergedTables: {
              select: { id: true, number: true, name: true, status: true },
            },
          },
        });

        const s = await tx.table.update({
          where: { id: secondaryTableId },
          data: {
            mergedWithTableId: primaryTableId,
            status: 'OCCUPIED',
            statusSince: new Date(),
          },
          include: {
            mergedWithTable: {
              select: { id: true, number: true, name: true, status: true },
            },
            mergedTables: {
              select: { id: true, number: true, name: true, status: true },
            },
          },
        });

        return { updatedPrimary: p, updatedSecondary: s };
      },
    );

    this.realtime.emitToBranch(branchId, 'table.updated', updatedPrimary);
    this.realtime.emitToBranch(branchId, 'table.updated', updatedSecondary);
    if (primaryOrder) {
      this.realtime.emitToBranch(branchId, 'order.updated', {
        id: primaryOrder.id,
      });
    }
    if (secondaryOrder) {
      this.realtime.emitToBranch(branchId, 'order.updated', {
        id: secondaryOrder.id,
      });
    }

    return {
      primaryTable: updatedPrimary,
      secondaryTable: updatedSecondary,
    };
  }

  async unmergeTable(branchId: string, secondaryTableId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id: secondaryTableId, floor: { branchId } },
    });
    if (!table) throw new NotFoundException('Table not found');
    if (!table.mergedWithTableId) {
      throw new BadRequestException('This table is not currently merged');
    }

    const masterTableId = table.mergedWithTableId;

    const updated = await this.prisma.$transaction(async (tx) => {
      const s = await tx.table.update({
        where: { id: secondaryTableId },
        data: {
          mergedWithTableId: null,
          status: 'AVAILABLE',
          statusSince: new Date(),
        },
        include: {
          mergedWithTable: {
            select: { id: true, number: true, name: true, status: true },
          },
          mergedTables: {
            select: { id: true, number: true, name: true, status: true },
          },
        },
      });

      const p = await tx.table.findUnique({
        where: { id: masterTableId },
        include: {
          mergedWithTable: {
            select: { id: true, number: true, name: true, status: true },
          },
          mergedTables: {
            select: { id: true, number: true, name: true, status: true },
          },
        },
      });

      return { unmergedTable: s, masterTable: p };
    });

    this.realtime.emitToBranch(branchId, 'table.updated', updated.unmergedTable);
    if (updated.masterTable) {
      this.realtime.emitToBranch(branchId, 'table.updated', updated.masterTable);
    }

    return updated;
  }

  private async assertFloorInBranch(branchId: string, floorId: string) {
    const floor = await this.prisma.floor.findFirst({
      where: { id: floorId, branchId },
    });
    if (!floor) throw new NotFoundException('Floor not found');
  }

  private async assertTableInBranch(branchId: string, tableId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, floor: { branchId } },
    });
    if (!table) throw new NotFoundException('Table not found');
  }
}
