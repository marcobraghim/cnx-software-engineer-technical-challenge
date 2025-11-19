import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailsysEntity } from './entities/emailsy.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EmailsysService {

  constructor(
    @InjectRepository(EmailsysEntity)
    private readonly repository: Repository<EmailsysEntity>,
  ) { }

  async create(userId: number) {
    const emailsy = this.repository.create({ user: { id: userId } });
    return await this.repository.save(emailsy);
  }

  findAll(userId: number) {
    return this.repository.find({ where: { user: { id: userId } } });
  }

  findOne(id: number, userId: number) {
    return this.repository.findOneBy({ id, user: { id: userId } });
  }
}
