import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class CsvFileValidatorPipe implements PipeTransform {
  transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    if (value.mimetype !== 'text/csv') {
      throw new BadRequestException('File must be a CSV file');
    } else if (value.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File must be less than 5MB');
    }
    return value; 
  }
}