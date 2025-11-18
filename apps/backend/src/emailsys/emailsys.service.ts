import { Injectable } from '@nestjs/common';
import { CreateEmailsysDto } from './dto/create-emailsy.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailsysEntity } from './entities/emailsy.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EmailsysService {

  constructor(
    @InjectRepository(EmailsysEntity)
    private readonly repository: Repository<EmailsysEntity>,
  ) { }

  async create(createEmailsysDto: CreateEmailsysDto) {
    // Criar registro no banco primeiro
    const emailsy = this.repository.create({
      user: { id: createEmailsysDto.userId }
    });
    return await this.repository.save(emailsy);
  }

  findAll(userId: number) {
    return this.repository.find({ where: { user: { id: userId } } });
  }

  findOne(id: number, userId: number) {
    return this.repository.findOneBy({ id, user: { id: userId } });
  }
}
