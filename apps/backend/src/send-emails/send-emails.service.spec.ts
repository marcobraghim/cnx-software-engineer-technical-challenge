import { Test, TestingModule } from '@nestjs/testing';
import { SendEmailsService } from './send-emails.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailserviceapiEntity } from './entities/emailserviceapi.entity';

const mockRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('SendEmailsService', () => {
  let service: SendEmailsService;

  beforeEach(async () => {
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
