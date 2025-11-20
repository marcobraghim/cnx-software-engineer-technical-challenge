import { Test, TestingModule } from '@nestjs/testing';
import { EmailsysService } from './emailsys.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailsysEntity } from './entities/emailsy.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
});

describe('EmailsysService', () => {
  let service: EmailsysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailsysService,
        {
          provide: getRepositoryToken(EmailsysEntity),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    service = module.get<EmailsysService>(EmailsysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
