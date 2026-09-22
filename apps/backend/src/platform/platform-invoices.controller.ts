import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformAuthGuard } from './auth/platform-auth.guard';

@ApiTags('platform-invoices')
@UseGuards(PlatformAuthGuard)
@Controller('v1/platform/invoices')
export class PlatformInvoicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('restaurantId') restaurantId?: string) {
    const where: any = {};
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    return this.prisma.subscriptionInvoice.findMany({
      where,
      orderBy: { issueDate: 'desc' },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            legalName: true,
            ownerName: true,
            ownerEmail: true,
          },
        },
        subscription: {
          include: {
            plan: {
              select: {
                name: true,
              },
            },
          },
        },
        payment: true,
      },
    });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const invoice = await this.prisma.subscriptionInvoice.findUnique({
      where: { id },
      include: {
        restaurant: true,
        subscription: {
          include: {
            plan: true,
          },
        },
        payment: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }
}
