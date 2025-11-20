import { IsEmail, IsString, MaxLength } from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  to: string;

  @IsString()
  @MaxLength(255)
  subject: string;

  @IsString()
  @MaxLength(10000)
  body: string;
}

