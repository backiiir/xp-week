import { DB_Group, DB_GroupMember, Role, jwtPayload } from '@common/index';
import { BadRequestException, CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Db, ObjectId } from 'mongodb';
import { InjectDb } from 'nest-mongodb';
import Roles from '../decorator/roles.decorator.js';

@Injectable()
export default class GroupGuard implements CanActivate {
  @Inject() private readonly reflector: Reflector;
  @InjectDb() private readonly db: Db;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get(Roles, context.getHandler());
    const request = context.switchToHttp().getRequest();

    const jwtPayload: jwtPayload = request.jwtPayload;

    if (!ObjectId.isValid(jwtPayload._id) || !ObjectId.isValid(request.params._id))
      throw new BadRequestException('ObjectId is not valid!');

    const userId = new ObjectId(jwtPayload._id);
    const groupId = new ObjectId(request.params._id);

    const group = await this.db.collection<DB_Group>('group').findOne({ _id: groupId }, { projection: { _id: 1, members: 1 } });
    if (!group) throw new BadRequestException('Group does not exist!');

    const member = group.members?.find((member: DB_GroupMember) => member.userId.equals(userId));

    if (!member) throw new UnauthorizedException('User is not part of this group!');
    else if (roles && !this.matchRoles(roles, [member.role])) throw new UnauthorizedException('User is not in Role to do this!');

    return true;
  }

  private matchRoles(roles: Role[], userRoles: Role[]): boolean {
    return roles.some((role) => userRoles.includes(role));
  }
}
