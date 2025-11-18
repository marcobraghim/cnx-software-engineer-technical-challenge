import { PartialType } from '@nestjs/mapped-types';
import { CreateEmailsysDto } from './create-emailsy.dto';

export class UpdateEmailsyDto extends PartialType(CreateEmailsysDto) {}
