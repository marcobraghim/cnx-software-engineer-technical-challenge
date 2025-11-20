import { Test, TestingModule } from '@nestjs/testing';
import { EmailsysItemService } from './emailsys.item.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailsysItemEntity } from '../entities/emailsys_item.entity';

const mockRepository = () => ({
  find: jest.fn(),
});

describe('EmailsysItemService', () => {
  let service: EmailsysItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailsysItemService,
        {
          provide: getRepositoryToken(EmailsysItemEntity),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    service = module.get<EmailsysItemService>(EmailsysItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
