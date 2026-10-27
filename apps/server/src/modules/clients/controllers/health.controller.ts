import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { API_ROUTES } from '../../../common/constants';
import { Public } from '../../auth/decorators/public.decorator';

@Controller(API_ROUTES.HEALTH)
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  async check() {
    let database = 'down';
    try {
      await this.dataSource.query('SELECT 1');
      database = 'up';
    } catch {
      // reported below
    }
    return { status: 'ok', database, time: new Date().toISOString() };
  }
}
