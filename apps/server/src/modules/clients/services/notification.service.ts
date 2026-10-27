import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from '../../users/entities/user.entity';
import { NotificationType } from '../enums/client.enums';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(
    userId: string,
    title: string,
    description: string,
    type: NotificationType,
    referenceId?: string,
  ): Promise<Notification> {
    const notification = this.notificationRepo.create({
      title,
      description,
      type,
      referenceId,
      user: { id: userId } as User,
    });
    return this.notificationRepo.save(notification);
  }

  async findAll(
    userId: string,
    unreadOnly: boolean = false,
  ): Promise<Notification[]> {
    const where: FindOptionsWhere<Notification> = { user: { id: userId } };
    if (unreadOnly) where.isRead = false;

    return this.notificationRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.isRead = true;
    return this.notificationRepo.save(notification);
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepo.count({
      where: { user: { id: userId }, isRead: false },
    });
    return { count };
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const res = await this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('user_id = :userId AND is_read = false', { userId })
      .execute();
    return { updated: res.affected ?? 0 };
  }
}
