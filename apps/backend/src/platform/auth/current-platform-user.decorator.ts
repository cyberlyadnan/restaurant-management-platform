import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PlatformSessionUser } from '@nodedr-restaurant/types';
import type { Request } from 'express';

export const CurrentPlatformUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PlatformSessionUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { platformUser: PlatformSessionUser }>();
    return request.platformUser;
  },
);
