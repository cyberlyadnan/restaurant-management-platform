import { Body, Controller, Get, Post, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  type RestaurantUpgradeDto,
  restaurantUpgradeSchema,
  type SessionUser,
} from '@nodedr-restaurant/types';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { BillingService } from './billing.service';

@ApiTags('billing')
@Controller('v1/restaurant/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Auth('settings.manage')
  @Get()
  async getOverview(@CurrentUser() user: SessionUser) {
    return this.billingService.getOverview(user.restaurantId);
  }

  @Auth('settings.manage')
  @Post('upgrade')
  @UsePipes(new ZodValidationPipe(restaurantUpgradeSchema))
  async upgradePlan(
    @CurrentUser() user: SessionUser,
    @Body() body: RestaurantUpgradeDto,
  ) {
    return this.billingService.upgradePlan(user.restaurantId, user.id, body);
  }
}
