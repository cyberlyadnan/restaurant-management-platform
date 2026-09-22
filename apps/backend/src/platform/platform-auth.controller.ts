import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import * as bcrypt from 'bcrypt';
import {
  platformLoginSchema,
  type PlatformLoginDto,
  type PlatformSessionUser,
} from '@nodedr-restaurant/types';
import { PrismaService } from '../prisma/prisma.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PlatformAuthGuard } from './auth/platform-auth.guard';
import { CurrentPlatformUser } from './auth/current-platform-user.decorator';

@ApiTags('platform-auth')
@Controller('v1/platform/auth')
export class PlatformAuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  @Post('login')
  @UsePipes(new ZodValidationPipe(platformLoginSchema))
  async login(
    @Body() dto: PlatformLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.prisma.platformUser.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid platform email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid platform email or password');
    }

    const token = await this.jwt.signAsync({
      sub: user.id,
      isPlatform: true,
    });

    res.cookie('platform_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    const sessionUser: PlatformSessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return { token, user: sessionUser };
  }

  @UseGuards(PlatformAuthGuard)
  @Get('me')
  getMe(@CurrentPlatformUser() user: PlatformSessionUser) {
    return { user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('platform_session', { path: '/' });
    return { ok: true };
  }
}
