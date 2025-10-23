import { Controller, Get, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // GET /notifications -> for the logged in user
  @Get()
  async getForUser(@Req() req) {
    const userId = req.user?.id ?? req.user?.sub;
    return this.notificationService.getNotificationsForUser(userId);
  }

  // PATCH /notifications/:id/read -> mark as read
  @Patch(':id/read')
  async markRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }
}
