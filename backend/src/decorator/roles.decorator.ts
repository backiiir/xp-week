import { Role } from '@common/index';
import { Reflector } from '@nestjs/core';

export const Roles = Reflector.createDecorator<Role[]>();
export default Roles;
