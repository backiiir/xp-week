import { Controller, Get, Inject, Render } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import AppService from '../service/app.service.js';

@Controller()
export class AppController {
  @Inject() private readonly appService: AppService;

  @Get()
  @ApiOperation({ summary: 'Just an entrypoint.' })
  @Render('index.hbs')
  root() {
    return { message: this.appService.getHello() };
  }
}
