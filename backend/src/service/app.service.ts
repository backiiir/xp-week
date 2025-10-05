import { Injectable } from '@nestjs/common';

@Injectable()
export default class AppService {
  public getHello(): string {
    return 'FLA Backend is running!';
  }
}
