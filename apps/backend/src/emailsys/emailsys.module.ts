import { Module } from '@nestjs/common';
import { EmailsysService } from './emailsys.service';
import { EmailsysController } from './emailsys.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { EmailsysEntity } from './entities/emailsy.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      EmailsysEntity,
    ]),
  ],
  controllers: [EmailsysController],
  providers: [EmailsysService],
})
export class EmailsysModule {}
