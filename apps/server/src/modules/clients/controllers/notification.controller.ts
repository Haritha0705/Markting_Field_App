import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { API_ROUTES } from '../../../common/constants';
import { NotificationService } from '../services/notification.service';

@Controller(API_ROUTES.NOTIFICATIONS)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(@Req() req: any, @Query('unreadOnly') unreadOnly?: string) {
    return this.notificationService.findAll(
      req.user.sub,
      unreadOnly === 'true',
    );
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: any) {
    return this.notificationService.getUnreadCount(req.user.sub);
  }

  @Put('read-all')
  markAllAsRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(req.user.sub);
  }

  @Put(':id/read')
  markAsRead(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.notificationService.markAsRead(id, req.user.sub);
  }
}
