import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CloseShiftDto,
  CashMovementDto,
  OpenShiftDto,
  XReportDto,
  ZReportDto,
} from '@nodedr-restaurant/types';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import type { Prisma } from '@prisma/client';

@Injectable()
export class ShiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async getCurrentShift(branchId: string) {
    const shift = await this.prisma.registerShift.findFirst({
      where: { branchId, status: 'OPEN' },
      include: {
        openedBy: { select: { id: true, name: true, email: true } },
        closedBy: { select: { id: true, name: true, email: true } },
        movements: {
          include: {
            recordedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!shift) return null;

    return {
      ...shift,
      startingCash: Number(shift.startingCash),
      cashSales: Number(shift.cashSales),
      cardSales: Number(shift.cardSales),
      upiSales: Number(shift.upiSales),
      otherSales: Number(shift.otherSales),
      cashRefunds: Number(shift.cashRefunds),
      cardRefunds: Number(shift.cardRefunds),
      paidIn: Number(shift.paidIn),
      paidOut: Number(shift.paidOut),
      expectedCash: Number(shift.expectedCash),
      actualCash: shift.actualCash !== null ? Number(shift.actualCash) : null,
      cashDifference:
        shift.cashDifference !== null ? Number(shift.cashDifference) : null,
      openedByName: shift.openedBy.name,
      closedByName: shift.closedBy?.name ?? null,
      movements: shift.movements.map((m) => ({
        ...m,
        amount: Number(m.amount),
        recordedByName: m.recordedBy.name,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  async openShift(branchId: string, userId: string, dto: OpenShiftDto) {
    const existing = await this.prisma.registerShift.findFirst({
      where: { branchId, status: 'OPEN' },
    });
    if (existing) {
      throw new BadRequestException(
        'A register shift is already open for this branch. Please close it first.',
      );
    }

    const shift = await this.prisma.registerShift.create({
      data: {
        branchId,
        openedById: userId,
        startingCash: dto.startingCash,
        expectedCash: dto.startingCash,
        notes: dto.notes,
        status: 'OPEN',
      },
      include: {
        openedBy: { select: { id: true, name: true } },
      },
    });

    this.realtime.emitToBranch(branchId, 'shift.opened', {
      id: shift.id,
      openedAt: shift.openedAt,
      openedByName: shift.openedBy.name,
      startingCash: Number(shift.startingCash),
    });

    return this.getCurrentShift(branchId);
  }

  async recordCashMovement(
    branchId: string,
    shiftId: string,
    userId: string,
    dto: CashMovementDto,
  ) {
    const shift = await this.prisma.registerShift.findFirst({
      where: { id: shiftId, branchId },
    });
    if (!shift) throw new NotFoundException('Shift not found');
    if (shift.status !== 'OPEN') {
      throw new BadRequestException('Cannot record movements on a closed shift.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const movement = await tx.shiftCashMovement.create({
        data: {
          shiftId,
          type: dto.type,
          amount: dto.amount,
          reason: dto.reason,
          recordedById: userId,
        },
        include: {
          recordedBy: { select: { id: true, name: true } },
        },
      });

      if (dto.type === 'PAID_IN') {
        await tx.registerShift.update({
          where: { id: shiftId },
          data: {
            paidIn: { increment: dto.amount },
            expectedCash: { increment: dto.amount },
          },
        });
      } else {
        // PAID_OUT or DROP
        await tx.registerShift.update({
          where: { id: shiftId },
          data: {
            paidOut: { increment: dto.amount },
            expectedCash: { decrement: dto.amount },
          },
        });
      }

      return movement;
    });

    this.realtime.emitToBranch(branchId, 'shift.movement', {
      shiftId,
      movement: {
        ...result,
        amount: Number(result.amount),
        recordedByName: result.recordedBy.name,
        createdAt: result.createdAt.toISOString(),
      },
    });

    return this.getCurrentShift(branchId);
  }

  async recordOrderPayment(
    tx: Prisma.TransactionClient,
    branchId: string,
    payments: { method: string; amount: number }[],
  ) {
    const openShift = await tx.registerShift.findFirst({
      where: { branchId, status: 'OPEN' },
    });
    if (!openShift) return;

    let cash = 0;
    let card = 0;
    let upi = 0;
    let other = 0;

    for (const p of payments) {
      const amt = Number(p.amount);
      if (p.method === 'CASH') cash += amt;
      else if (p.method === 'CARD') card += amt;
      else if (p.method === 'UPI') upi += amt;
      else other += amt;
    }

    await tx.registerShift.update({
      where: { id: openShift.id },
      data: {
        cashSales: { increment: cash },
        cardSales: { increment: card },
        upiSales: { increment: upi },
        otherSales: { increment: other },
        expectedCash: { increment: cash },
      },
    });
  }

  async recordOrderRefund(
    tx: Prisma.TransactionClient,
    branchId: string,
    method: string,
    amount: number,
  ) {
    const openShift = await tx.registerShift.findFirst({
      where: { branchId, status: 'OPEN' },
    });
    if (!openShift) return;

    const amt = Number(amount);
    if (method === 'CASH') {
      await tx.registerShift.update({
        where: { id: openShift.id },
        data: {
          cashRefunds: { increment: amt },
          expectedCash: { decrement: amt },
        },
      });
    } else if (method === 'CARD') {
      await tx.registerShift.update({
        where: { id: openShift.id },
        data: {
          cardRefunds: { increment: amt },
        },
      });
    }
  }

  async generateXReport(branchId: string, shiftId: string): Promise<XReportDto> {
    const shift = await this.prisma.registerShift.findFirst({
      where: { id: shiftId, branchId },
      include: {
        branch: { select: { name: true } },
        openedBy: { select: { name: true } },
        movements: {
          include: { recordedBy: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!shift) throw new NotFoundException('Shift not found');

    const orders = await this.prisma.order.findMany({
      where: {
        branchId,
        status: 'PAID',
        billedAt: { gte: shift.openedAt, lte: shift.closedAt ?? new Date() },
      },
      select: {
        totalAmount: true,
        discountAmount: true,
        taxAmount: true,
      },
    });

    const grossSales =
      Number(shift.cashSales) +
      Number(shift.cardSales) +
      Number(shift.upiSales) +
      Number(shift.otherSales);
    const netSales =
      grossSales - Number(shift.cashRefunds) - Number(shift.cardRefunds);

    const totalDiscounts = orders.reduce(
      (sum, o) => sum + Number(o.discountAmount),
      0,
    );
    const totalTaxes = orders.reduce((sum, o) => sum + Number(o.taxAmount), 0);

    const expectedCashInDrawer =
      Number(shift.startingCash) +
      Number(shift.cashSales) -
      Number(shift.cashRefunds) +
      Number(shift.paidIn) -
      Number(shift.paidOut);

    return {
      reportType: 'X_REPORT',
      shiftId: shift.id,
      branchId,
      branchName: shift.branch.name,
      openedAt: shift.openedAt.toISOString(),
      generatedAt: new Date().toISOString(),
      cashierName: shift.openedBy.name,
      startingCash: Number(shift.startingCash),
      grossSales,
      netSales,
      taxAmount: totalTaxes,
      discountAmount: totalDiscounts,
      orderCount: orders.length,
      tenderBreakdown: {
        cash: Number(shift.cashSales),
        card: Number(shift.cardSales),
        upi: Number(shift.upiSales),
        wallet: 0,
        other: Number(shift.otherSales),
      },
      paidIn: Number(shift.paidIn),
      paidOut: Number(shift.paidOut),
      cashRefunds: Number(shift.cashRefunds),
      expectedCashInDrawer,
      movements: shift.movements.map((m) => ({
        id: m.id,
        shiftId: m.shiftId,
        type: m.type,
        amount: Number(m.amount),
        reason: m.reason,
        recordedById: m.recordedById,
        recordedByName: m.recordedBy.name,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  async closeShift(
    branchId: string,
    shiftId: string,
    userId: string,
    dto: CloseShiftDto,
  ): Promise<ZReportDto> {
    const shift = await this.prisma.registerShift.findFirst({
      where: { id: shiftId, branchId },
      include: {
        branch: { select: { name: true } },
        openedBy: { select: { name: true } },
        movements: {
          include: { recordedBy: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!shift) throw new NotFoundException('Shift not found');
    if (shift.status !== 'OPEN') {
      throw new BadRequestException('Shift is already closed.');
    }

    const expectedCash =
      Number(shift.startingCash) +
      Number(shift.cashSales) -
      Number(shift.cashRefunds) +
      Number(shift.paidIn) -
      Number(shift.paidOut);

    const actualCash = dto.actualCash;
    const cashDifference = actualCash - expectedCash;
    const closedAt = new Date();

    const closedUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await this.prisma.registerShift.update({
      where: { id: shiftId },
      data: {
        status: 'CLOSED',
        closedAt,
        closedById: userId,
        actualCash,
        expectedCash,
        cashDifference,
        notes: dto.notes,
      },
    });

    const xReport = await this.generateXReport(branchId, shiftId);

    const zReport: ZReportDto = {
      ...xReport,
      reportType: 'Z_REPORT',
      closedAt: closedAt.toISOString(),
      closedByName: closedUser?.name ?? 'Manager',
      actualCashCounted: actualCash,
      cashDifference,
      closingNotes: dto.notes ?? null,
    };

    this.realtime.emitToBranch(branchId, 'shift.closed', {
      shiftId,
      zReport,
    });

    return zReport;
  }

  async listShifts(branchId: string, page = 1, limit = 20) {
    const take = Math.min(Math.max(1, limit), 100);
    const skip = (Math.max(1, page) - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.registerShift.findMany({
        where: { branchId },
        include: {
          openedBy: { select: { id: true, name: true } },
          closedBy: { select: { id: true, name: true } },
        },
        orderBy: { openedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.registerShift.count({ where: { branchId } }),
    ]);

    return {
      data: items.map((s) => ({
        id: s.id,
        branchId: s.branchId,
        openedAt: s.openedAt.toISOString(),
        closedAt: s.closedAt ? s.closedAt.toISOString() : null,
        status: s.status,
        startingCash: Number(s.startingCash),
        cashSales: Number(s.cashSales),
        cardSales: Number(s.cardSales),
        upiSales: Number(s.upiSales),
        otherSales: Number(s.otherSales),
        expectedCash: Number(s.expectedCash),
        actualCash: s.actualCash !== null ? Number(s.actualCash) : null,
        cashDifference:
          s.cashDifference !== null ? Number(s.cashDifference) : null,
        openedByName: s.openedBy.name,
        closedByName: s.closedBy?.name ?? null,
        notes: s.notes,
      })),
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }
}
