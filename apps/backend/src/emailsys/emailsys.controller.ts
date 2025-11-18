import { Controller, Get, Post, Param, NotFoundException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { EmailsysService } from './emailsys.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CsvFileValidatorPipe } from './validators/csv.file.validator.pipe';
import { CsvEmailValidatorPipe } from './validators/csv.email.validator.pipe';
import type { CsvFileWithEmails } from './validators/csv.email.validator.pipe';

@Controller('emailsys')
export class EmailsysController {
  constructor(private readonly emailsysService: EmailsysService) { }

  /**
   * This User ID should be from the Auth Token
   */
  private userId: number = 1

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile(
      new CsvFileValidatorPipe(),
      new CsvEmailValidatorPipe(),
    ) csvFile: CsvFileWithEmails
  ) {

    const emailsy = await this.emailsysService.create({ userId: this.userId });

    // console.log(csvFile.extractedEmails);

    return emailsy;
  }

  @Get()
  findAll() {
    return this.emailsysService.findAll(this.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const emailsy = await this.emailsysService.findOne(+id, this.userId);
    if (!emailsy) {
      throw new NotFoundException()
    }
    return emailsy
  }

  /** In this context we removed Update and Delete methods */
}
