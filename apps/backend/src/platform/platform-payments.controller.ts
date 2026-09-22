import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  recordPaymentSchema,
  type RecordPaymentDto,
  type PlatformSessionUser,
} from '@nodedr-restaurant/types';
import { PrismaService } from '../prisma/prisma.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PlatformAuthGuard } from './auth/platform-auth.guard';
import { CurrentPlatformUser } from './auth/current-platform-user.decorator';

@ApiTags('platform-payments')
@UseGuards(PlatformAuthGuard)
@Controller('v1/platform/payments')
export class PlatformPaymentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('restaurantId') restaurantId?: string) {
    const where: any = {};
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    return this.prisma.subscriptionPayment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            ownerName: true,
            ownerEmail: true,
          },
        },
        recordedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
          },
        },
      },
    });
  }

  @Post()
  @UsePipes(new ZodValidationPipe(recordPaymentSchema))
  async recordPayment(
    @Body() dto: RecordPaymentDto & { restaurantId: string },
    @CurrentPlatformUser() platformUser: PlatformSessionUser,
  ) {
    const payment = await this.prisma.$transaction(async (tx) => {
      const p = await tx.subscriptionPayment.create({
        data: {
          restaurantId: dto.restaurantId,
          subscriptionId: dto.subscriptionId,
          amount: dto.amount,
          currency: dto.currency,
          method: dto.method,
          status: 'SUCCESS',
          reference: dto.reference,
          notes: dto.notes,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
          recordedById: platformUser.id,
        },
      });

      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      await tx.subscriptionInvoice.create({
        data: {
          invoiceNumber,
          restaurantId: dto.restaurantId,
          subscriptionId: dto.subscriptionId,
          paymentId: p.id,
          subtotal: dto.amount,
          totalAmount: dto.amount,
          currency: dto.currency,
          status: 'PAID',
          paidAt: new Date(),
          notes: dto.notes,
        },
      });

      await tx.platformAuditLog.create({
        data: {
          platformUserId: platformUser.id,
          action: 'PAYMENT_RECORDED',
          targetType: 'PAYMENT',
          targetId: p.id,
          metadata: {
            restaurantId: dto.restaurantId,
            amount: dto.amount,
            method: dto.method,
          },
        },
      });

      return p;
    });

    return payment;
  }
}
