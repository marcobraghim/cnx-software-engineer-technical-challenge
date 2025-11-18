import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { Readable } from "stream";
import csv from "csv-parser";
import EmailValidator from 'email-validator';

// Estender o tipo do arquivo para incluir os emails extraídos
export interface CsvFileWithEmails extends Express.Multer.File {
  extractedEmails?: string[];
}

@Injectable()
export class CsvEmailValidatorPipe implements PipeTransform {
  async transform(value: Express.Multer.File): Promise<CsvFileWithEmails> {
    if (!value || !value.buffer) {
      throw new BadRequestException('File is required');
    }

    const emailsSet = new Set<string>();
    const invalidEmails: string[] = [];

    return new Promise((resolve, reject) => {
      const stream = Readable.from(value.buffer);
      
      stream
        .pipe(csv())
        .on('headers', (headers: string[]) => {
          // Verifica se a coluna 'email' existe (case-insensitive)
          const hasEmailColumn = headers.some(header => header.toLowerCase().trim() === 'email');
          
          if (!hasEmailColumn) {
            stream.destroy();
            reject(new BadRequestException('CSV file must contain an "email" column'));
            return;
          }
        })
        .on('data', (row: any) => {
          // Encontra a coluna email (case-insensitive)
          const emailKey = Object.keys(row).find(key => key.toLowerCase().trim() === 'email');
          
          if (emailKey) {
            const email = row[emailKey]?.trim();
            
            if (email) {
              if (!EmailValidator.validate(email)) {
                invalidEmails.push(email);
              } else {
                // Adiciona ao Set para remover duplicados e normalizar para lowercase
                emailsSet.add(email.toLowerCase());
              }
            }
          }
        })
        .on('end', () => {
          if (invalidEmails.length > 0) {
            reject(new BadRequestException(
              `Invalid email addresses found: ${invalidEmails.slice(0, 10).join(', ')}${invalidEmails.length > 10 ? ` and ${invalidEmails.length - 10} more` : ''}`
            ));
            return;
          }
          
          const uniqueEmails = Array.from(emailsSet);
          
          if (uniqueEmails.length === 0) {
            reject(new BadRequestException('No valid email addresses found in the CSV file'));
            return;
          }
          
          // Adiciona os emails extraídos ao objeto do arquivo
          const fileWithEmails: CsvFileWithEmails = {
            ...value,
            extractedEmails: uniqueEmails,
          };
          
          resolve(fileWithEmails);
        })
        .on('error', (error: Error) => {
          reject(new BadRequestException(`Error reading CSV file: ${error.message}`));
        });
    });
  }
}