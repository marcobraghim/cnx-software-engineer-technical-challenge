import { Module } from '@nestjs/common';
import { SendEmailsService } from './send-emails.service';
import { SendEmailsController } from './send-emails.controller';
import { EmailserviceapiEntity } from './entities/emailserviceapi.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailsysItemEntity } from './entities/emailsys_item.entity';
import { EmailsysItemService } from './services/emailsys.item.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmailserviceapiEntity,
      EmailsysItemEntity,
    ]),
  ],
  controllers: [SendEmailsController],
  providers: [SendEmailsService, EmailsysItemService],
})
export class SendEmailsModule {}
