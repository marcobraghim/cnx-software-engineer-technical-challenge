import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailsysItemEntity } from '../entities/emailsys_item.entity';
import { EmailsysItemStatus } from '../enums/emailsys-item-status.enum';

@Injectable()
export class EmailsysItemService {
  constructor(
    @InjectRepository(EmailsysItemEntity)
    private readonly repository: Repository<EmailsysItemEntity>,
  ) {}

  async getEmailsToSend(limit: number) {
    return this.repository.find({
      where: { status: EmailsysItemStatus.Pending },
      order: { created_at: 'ASC' },
      take: limit,
      relations: ['emailsys'],
    });
  }

  async updateStatus(emailId: number, status: EmailsysItemStatus) {
    await this.repository.update(emailId, {
      status,
    });
  }
}
