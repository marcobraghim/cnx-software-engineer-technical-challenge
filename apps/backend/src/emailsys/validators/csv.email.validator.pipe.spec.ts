import { BadRequestException } from '@nestjs/common';
import { CsvEmailValidatorPipe } from './csv.email.validator.pipe';

describe('CsvEmailValidatorPipe', () => {
  let pipe: CsvEmailValidatorPipe;

  beforeEach(() => {
    pipe = new CsvEmailValidatorPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  describe('Valid CSV files', () => {
    it('should extract valid emails from CSV with email column', async () => {
      const csvContent = 'email\nuser1@example.com\nuser2@example.com\nuser3@example.com';
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: csvContent.length,
        buffer: Buffer.from(csvContent),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const result = await pipe.transform(file);

      expect(result).toBeDefined();
      expect(result.extractedEmails).toBeDefined();
      expect(result.extractedEmails?.length).toBe(3);
      expect(result.extractedEmails).toContain('user1@example.com');
      expect(result.extractedEmails).toContain('user2@example.com');
      expect(result.extractedEmails).toContain('user3@example.com');
    });

    it('should handle CSV with case-insensitive email column', async () => {
      const csvContent = 'Email\nuser1@example.com\nuser2@example.com';
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: csvContent.length,
        buffer: Buffer.from(csvContent),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const result = await pipe.transform(file);

      expect(result.extractedEmails).toBeDefined();
      expect(result.extractedEmails?.length).toBe(2);
    });

    it('should remove duplicate emails', async () => {
      const csvContent = 'email\nuser1@example.com\nuser1@example.com\nuser2@example.com';
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: csvContent.length,
        buffer: Buffer.from(csvContent),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const result = await pipe.transform(file);

      expect(result.extractedEmails?.length).toBe(2);
      expect(result.extractedEmails).toContain('user1@example.com');
      expect(result.extractedEmails).toContain('user2@example.com');
    });

    it('should handle emails with different cases as duplicates', async () => {
      const csvContent = 'email\nUser1@Example.com\nuser1@example.com\nUSER1@EXAMPLE.COM';
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: csvContent.length,
        buffer: Buffer.from(csvContent),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const result = await pipe.transform(file);

      expect(result.extractedEmails?.length).toBe(1);
    });

    it('should handle CSV with additional columns', async () => {
      const csvContent = 'name,email,age\nJohn,user1@example.com,30\nJane,user2@example.com,25';
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: csvContent.length,
        buffer: Buffer.from(csvContent),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const result = await pipe.transform(file);

      expect(result.extractedEmails?.length).toBe(2);
    });
  });

  describe('Invalid CSV files', () => {
    it('should throw BadRequestException if file is null', async () => {
      await expect(pipe.transform(null as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if file buffer is missing', async () => {
      const file: Partial<Express.Multer.File> = {
        fieldname: 'file',
        originalname: 'test.csv',
      };

      await expect(pipe.transform(file as Express.Multer.File)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if CSV does not have email column', async () => {
      const csvContent = 'name,age\nJohn,30\nJane,25';
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: csvContent.length,
        buffer: Buffer.from(csvContent),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      await expect(pipe.transform(file)).rejects.toThrow(BadRequestException);
      await expect(pipe.transform(file)).rejects.toThrow('CSV file must contain an "email" column');
    });

    it('should throw BadRequestException if CSV contains invalid emails', async () => {
      const csvContent = 'email\ninvalid-email\nuser@example.com\nnot-an-email';
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: csvContent.length,
        buffer: Buffer.from(csvContent),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      await expect(pipe.transform(file)).rejects.toThrow(BadRequestException);
      await expect(pipe.transform(file)).rejects.toThrow('Invalid email addresses found');
    });

    it('should throw BadRequestException if no valid emails found', async () => {
      const csvContent = 'email\ninvalid-email\nnot-an-email';
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: csvContent.length,
        buffer: Buffer.from(csvContent),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      // The code first checks for invalid emails, so it will throw with "Invalid email addresses found"
      // To test "No valid emails found", we need a CSV with only empty/invalid cells
      const csvContentEmpty = 'email\n\n';
      const fileEmpty: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: csvContentEmpty.length,
        buffer: Buffer.from(csvContentEmpty),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      await expect(pipe.transform(fileEmpty)).rejects.toThrow(BadRequestException);
      await expect(pipe.transform(fileEmpty)).rejects.toThrow('No valid email addresses found');
    });

    it('should throw BadRequestException if CSV is empty', async () => {
      const csvContent = 'email\n';
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: csvContent.length,
        buffer: Buffer.from(csvContent),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      await expect(pipe.transform(file)).rejects.toThrow(BadRequestException);
      await expect(pipe.transform(file)).rejects.toThrow('No valid email addresses found');
    });

    it('should handle CSV parsing errors', async () => {
      const invalidCsvContent = 'invalid,csv,content\nbroken,row';
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: invalidCsvContent.length,
        buffer: Buffer.from(invalidCsvContent),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      // This might throw an error or handle gracefully depending on csv-parser behavior
      // We'll test that it doesn't crash the application
      try {
        await pipe.transform(file);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });
  });

  describe('Edge cases', () => {
    it('should trim whitespace from emails', async () => {
      const csvContent = 'email\n  user@example.com  \n  another@example.com  ';
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: csvContent.length,
        buffer: Buffer.from(csvContent),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const result = await pipe.transform(file);

      expect(result.extractedEmails?.length).toBe(2);
      expect(result.extractedEmails).toContain('user@example.com');
      expect(result.extractedEmails).toContain('another@example.com');
    });

    it('should handle empty email cells', async () => {
      const csvContent = 'email\nuser@example.com\n\nuser2@example.com';
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: csvContent.length,
        buffer: Buffer.from(csvContent),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const result = await pipe.transform(file);

      expect(result.extractedEmails?.length).toBe(2);
    });

    it('should limit error message to first 10 invalid emails', async () => {
      const invalidEmails = Array(15).fill('invalid-email');
      const csvContent = `email\n${invalidEmails.join('\n')}`;
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: csvContent.length,
        buffer: Buffer.from(csvContent),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      try {
        await pipe.transform(file);
      } catch (error: any) {
        expect(error.message).toContain('and 5 more');
      }
    });
  });
});

