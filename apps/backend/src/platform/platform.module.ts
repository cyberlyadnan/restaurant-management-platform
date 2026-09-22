import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { PlatformJwtStrategy } from './auth/platform-jwt.strategy';
import { PlatformAuthGuard } from './auth/platform-auth.guard';
import { PlatformAuthController } from './platform-auth.controller';
import { PlatformDashboardController } from './platform-dashboard.controller';
import { PlatformRestaurantsController } from './platform-restaurants.controller';
import { PlatformPlansController } from './platform-plans.controller';
import { PlatformSubscriptionsController } from './platform-subscriptions.controller';
import { PlatformPaymentsController } from './platform-payments.controller';
import { PlatformInvoicesController } from './platform-invoices.controller';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [
    PlatformAuthController,
    PlatformDashboardController,
    PlatformRestaurantsController,
    PlatformPlansController,
    PlatformSubscriptionsController,
    PlatformPaymentsController,
    PlatformInvoicesController,
  ],
  providers: [PlatformJwtStrategy, PlatformAuthGuard],
  exports: [PlatformAuthGuard],
})
export class PlatformModule {}
