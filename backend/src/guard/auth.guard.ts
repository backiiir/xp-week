import { DB_User, jwtPayload } from '@common/index';
import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Db, ObjectId } from 'mongodb';
import { InjectDb } from 'nest-mongodb';

@Injectable()
export default class AuthGuard implements CanActivate {
  @Inject() private readonly configService: ConfigService;
  @Inject() private readonly jwtService: JwtService;
  @InjectDb() private readonly db: Db;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) throw new UnauthorizedException();

    try {
      const payload: jwtPayload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('app.jwt.secret'),
      });

      // If user does not exist (anymore?), throw UnauthorizedException
      if ((await this.db.collection<DB_User>('user').countDocuments({ _id: new ObjectId(payload._id) })) === 0)
        throw new UnauthorizedException();

      request.jwtPayload = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
