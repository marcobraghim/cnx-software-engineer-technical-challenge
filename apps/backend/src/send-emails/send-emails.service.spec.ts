import { Test, TestingModule } from '@nestjs/testing';
import { SendEmailsService } from './send-emails.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailserviceapiEntity } from './entities/emailserviceapi.entity';
import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

const mockRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('SendEmailsService', () => {
  let service: SendEmailsService;
  let repository: ReturnType<typeof mockRepository>;
  let originalFetch: typeof fetch;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    // Save original fetch and env
    originalFetch = global.fetch;
    originalEnv = process.env;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendEmailsService,
        {
          provide: getRepositoryToken(EmailserviceapiEntity),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    service = module.get<SendEmailsService>(SendEmailsService);
    repository = module.get(getRepositoryToken(EmailserviceapiEntity));

    // Set default env vars
    process.env.EMAILSYSAPI_BASE_URL = 'https://test-api.example.com';
    process.env.EMAILSYSAPI_USERNAME = 'test_user';
    process.env.EMAILSYSAPI_PASSWORD = 'test_password';
  });

  afterEach(() => {
    // Restore original fetch and env
    global.fetch = originalFetch;
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ensureValidEmailServiceToken', () => {
    it('should return cached token if still valid', async () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      const cachedToken: EmailserviceapiEntity = {
        id: 1,
        jwttoken: 'cached-token',
        expiration: futureDate,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Set cached token using reflection
      (service as any).cachedToken = cachedToken;

      const result = await service.ensureValidEmailServiceToken();

      expect(result).toBe(cachedToken);
      expect(repository.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from database if cache is expired', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const dbToken: EmailserviceapiEntity = {
        id: 1,
        jwttoken: 'db-token',
        expiration: futureDate,
        created_at: new Date(),
        updated_at: new Date(),
      };

      repository.findOne.mockResolvedValue(dbToken);

      const result = await service.ensureValidEmailServiceToken();

      expect(result).toBe(dbToken);
      expect(repository.findOne).toHaveBeenCalled();
      expect((service as any).cachedToken).toBe(dbToken);
    });

    it('should create new token if none exists in database', async () => {
      repository.findOne.mockResolvedValue(null);

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'new-token',
          expires_in: 1800,
        }),
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

      const savedToken: EmailserviceapiEntity = {
        id: 1,
        jwttoken: 'new-token',
        expiration: new Date(Date.now() + 1800000),
        created_at: new Date(),
        updated_at: new Date(),
      };

      repository.create.mockReturnValue(savedToken);
      repository.save.mockResolvedValue(savedToken);

      const result = await service.ensureValidEmailServiceToken();

      expect(result).toBe(savedToken);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect((service as any).cachedToken).toBe(savedToken);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-api.example.com/auth/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('should throw error if credentials are missing', async () => {
      delete process.env.EMAILSYSAPI_USERNAME;
      delete process.env.EMAILSYSAPI_PASSWORD;

      repository.findOne.mockResolvedValue(null);

      await expect(service.ensureValidEmailServiceToken()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw error if API request fails', async () => {
      repository.findOne.mockResolvedValue(null);
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(service.ensureValidEmailServiceToken()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw error if API returns non-ok status', async () => {
      repository.findOne.mockResolvedValue(null);

      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue('Error message'),
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

      await expect(service.ensureValidEmailServiceToken()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw error if token response is invalid', async () => {
      repository.findOne.mockResolvedValue(null);

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: null,
          expires_in: 1800,
        }),
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

      await expect(service.ensureValidEmailServiceToken()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('sendEmail', () => {
    const mockEmailData = {
      to: 'test@example.com',
      subject: 'Test Subject',
      body: 'Test Body',
    };

    beforeEach(async () => {
      // Setup valid token
      const futureDate = new Date(Date.now() + 3600000);
      const token: EmailserviceapiEntity = {
        id: 1,
        jwttoken: 'valid-token',
        expiration: futureDate,
        created_at: new Date(),
        updated_at: new Date(),
      };

      repository.findOne.mockResolvedValue(token);
      (service as any).cachedToken = token;
    });

    it('should send email successfully with status 200', async () => {
      const mockResponse = {
        status: 200,
        ok: true,
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

      const result = await service.sendEmail(mockEmailData);

      expect(result).toBeUndefined();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-api.example.com/send-email',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify(mockEmailData),
        }),
      );
    });

    it('should send email successfully with status 202', async () => {
      const mockResponse = {
        status: 202,
        ok: true,
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

      const result = await service.sendEmail(mockEmailData);

      expect(result).toBeUndefined();
    });

    it('should throw BadRequestException for status 400', async () => {
      const mockResponse = {
        status: 400,
        ok: false,
        text: jest.fn().mockResolvedValue('Invalid payload'),
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

      await expect(service.sendEmail(mockEmailData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException for status 401', async () => {
      const mockResponse = {
        status: 401,
        ok: false,
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

      await expect(service.sendEmail(mockEmailData)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw HttpException for status 429', async () => {
      const mockResponse = {
        status: 429,
        ok: false,
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

      await expect(service.sendEmail(mockEmailData)).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw InternalServerErrorException for status 500', async () => {
      const mockResponse = {
        status: 500,
        ok: false,
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

      await expect(service.sendEmail(mockEmailData)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw BadGatewayException for status 502', async () => {
      const mockResponse = {
        status: 502,
        ok: false,
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

      await expect(service.sendEmail(mockEmailData)).rejects.toThrow(
        BadGatewayException,
      );
    });

    it('should throw ServiceUnavailableException for status 503', async () => {
      const mockResponse = {
        status: 503,
        ok: false,
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

      await expect(service.sendEmail(mockEmailData)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw BadGatewayException if fetch fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(service.sendEmail(mockEmailData)).rejects.toThrow(
        BadGatewayException,
      );
    });

    it('should throw HttpException for unexpected status codes', async () => {
      const mockResponse = {
        status: 418,
        ok: false,
        statusText: "I'm a teapot",
        text: jest.fn().mockResolvedValue('Teapot error'),
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

      await expect(service.sendEmail(mockEmailData)).rejects.toThrow(
        HttpException,
      );
    });
  });
});
