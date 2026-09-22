import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  cashMovementSchema,
  closeShiftSchema,
  openShiftSchema,
  type CashMovementDto,
  type CloseShiftDto,
  type OpenShiftDto,
  type SessionUser,
} from '@nodedr-restaurant/types';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { BranchAccessService } from '../../common/services/branch-access.service';
import { ShiftsService } from './shifts.service';

@ApiTags('shifts')
@Controller('v1/shifts')
export class ShiftsController {
  constructor(
    private readonly shiftsService: ShiftsService,
    private readonly branchAccess: BranchAccessService,
  ) {}

  @Auth('cash_drawer.view')
  @Get('current')
  async getCurrent(
    @CurrentUser() user: SessionUser,
    @Query('branchId') branchId: string,
  ) {
    await this.branchAccess.assertAccess(user.restaurantId, branchId);
    return this.shiftsService.getCurrentShift(branchId);
  }

  @Auth('cash_drawer.manage')
  @Post('open')
  @UsePipes(new ZodValidationPipe(openShiftSchema))
  async openShift(
    @CurrentUser() user: SessionUser,
    @Query('branchId') branchId: string,
    @Body() body: OpenShiftDto,
  ) {
    await this.branchAccess.assertAccess(user.restaurantId, branchId);
    return this.shiftsService.openShift(branchId, user.id, body);
  }

  @Auth('cash_drawer.manage')
  @Post(':id/movements')
  @UsePipes(new ZodValidationPipe(cashMovementSchema))
  async recordCashMovement(
    @CurrentUser() user: SessionUser,
    @Query('branchId') branchId: string,
    @Param('id') id: string,
    @Body() body: CashMovementDto,
  ) {
    await this.branchAccess.assertAccess(user.restaurantId, branchId);
    return this.shiftsService.recordCashMovement(branchId, id, user.id, body);
  }

  @Auth('cash_drawer.view')
  @Get(':id/x-report')
  async getXReport(
    @CurrentUser() user: SessionUser,
    @Query('branchId') branchId: string,
    @Param('id') id: string,
  ) {
    await this.branchAccess.assertAccess(user.restaurantId, branchId);
    return this.shiftsService.generateXReport(branchId, id);
  }

  @Auth('cash_drawer.manage')
  @Post(':id/close')
  @UsePipes(new ZodValidationPipe(closeShiftSchema))
  async closeShift(
    @CurrentUser() user: SessionUser,
    @Query('branchId') branchId: string,
    @Param('id') id: string,
    @Body() body: CloseShiftDto,
  ) {
    await this.branchAccess.assertAccess(user.restaurantId, branchId);
    return this.shiftsService.closeShift(branchId, id, user.id, body);
  }

  @Auth('cash_drawer.view')
  @Get()
  async listShifts(
    @CurrentUser() user: SessionUser,
    @Query('branchId') branchId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    await this.branchAccess.assertAccess(user.restaurantId, branchId);
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.shiftsService.listShifts(branchId, p, l);
  }
}
