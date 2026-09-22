import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { PlatformSessionUser } from '@nodedr-restaurant/types';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

interface PlatformJwtPayload {
  sub: string;
  isPlatform?: boolean;
}

const cookieOrHeaderExtractor = (req: {
  cookies?: Record<string, string>;
  headers?: Record<string, string | string[] | undefined>;
}): string | null => {
  if (req.cookies?.['platform_session']) {
    return req.cookies['platform_session'];
  }
  const authHeader = req.headers?.['authorization'];
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
};

@Injectable()
export class PlatformJwtStrategy extends PassportStrategy(
  Strategy,
  'platform-jwt',
) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieOrHeaderExtractor]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: PlatformJwtPayload): Promise<PlatformSessionUser> {
    const user = await this.prisma.platformUser.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Platform session is invalid or expired');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
