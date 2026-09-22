import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OrdersModule } from '../orders/orders.module';
import { PublicMenuController } from './public-menu.controller';
import { PublicMenuService } from './public-menu.service';
import { PublicPlansController } from './public-plans.controller';
import { PublicRegisterController } from './public-register.controller';

@Module({
  imports: [
    OrdersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [
    PublicMenuController,
    PublicPlansController,
    PublicRegisterController,
  ],
  providers: [PublicMenuService],
})
export class PublicModule {}
