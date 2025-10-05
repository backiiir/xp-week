import { jwtPayload } from '@common/index';
import { BadRequestException, ExecutionContext, createParamDecorator } from '@nestjs/common';
import { ObjectId } from 'bson';

export const UserId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  if (!request.jwtPayload?._id) throw new BadRequestException('AuthGuard must be specified for this decorator to work!');
  return new ObjectId((request.jwtPayload as jwtPayload)._id);
});
export default UserId;
