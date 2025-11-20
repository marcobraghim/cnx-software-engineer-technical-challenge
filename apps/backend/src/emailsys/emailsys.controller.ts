import { Controller, Get, Post, Param, NotFoundException, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { EmailsysService } from './emailsys.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CsvFileValidatorPipe } from './validators/csv.file.validator.pipe';
import { CsvEmailValidatorPipe } from './validators/csv.email.validator.pipe';
import type { CsvFileWithEmails } from './validators/csv.email.validator.pipe';
import { GcpStorageService } from 'src/providers/gcp.storage.service';

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
    if (!process.env.GCP_PROJECT_ID || !process.env.GCP_STORAGE_BUCKET) {
      throw new BadRequestException('GCP_PROJECT_ID and GCP_STORAGE_BUCKET environment variables must be set');
    }

    const emailsys = await this.emailsysService.create(this.userId);

    // 50k emails por arquivo, cerca de 1Mb por arquivo
    const chunkSize = +(process.env.EMAILSYS_CHUNK_SIZE || 50000);
    const extractedEmails = csvFile.extractedEmails ?? [];

    // Divide emails em arquivos menores para evitar 
    // timeout do Cloud Functions
    const chunks: string[][] = [];
    for (let i = 0; i < extractedEmails.length; i += chunkSize) {
      chunks.push(extractedEmails.slice(i, i + chunkSize));
    }

    const gcpStorageService = new GcpStorageService(process.env.GCP_PROJECT_ID, process.env.GCP_STORAGE_BUCKET);

    // Faz upload de todos os arquivos JSON ao mesmo tempo
    await Promise.all(
      chunks.map(async (emailsChunk, index) => {
        const fileContent = JSON.stringify({
          emailsysId: emailsys.id,
          emails: emailsChunk,
        });

        const fileName = `emailsys-id${emailsys.id}-seq${index + 1}.json`;
        const buffer = Buffer.from(fileContent, 'utf-8');

        await gcpStorageService.uploadJsonFile(fileName, buffer);
      })
    );

    return emailsys;
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
