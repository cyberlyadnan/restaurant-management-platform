import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class PlatformAuthGuard extends AuthGuard('platform-jwt') {
  handleRequest<TUser = any>(
    err: any,
    user: any,
    _info: any,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Platform authorization required');
    }
    const req = context.switchToHttp().getRequest();
    req.platformUser = user;
    return user;
  }
}
