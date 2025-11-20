import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { EmailsysModule } from './emailsys/emailsys.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SendEmailsModule } from './send-emails/send-emails.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: process.env.BE_DB_HOST || 'localhost',
        port: 5432,
        username: configService.get('BE_DB_USER'),
        password: configService.get('BE_DB_PASSWORD'),
        database: configService.get('BE_DB_NAME'),
        autoLoadEntities: true,
        synchronize: false, // TODO: Use migrations on production instead
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
      }),
      inject: [ConfigService],
    }),
    EmailsysModule,
    SendEmailsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
