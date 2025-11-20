import { Test, TestingModule } from '@nestjs/testing';
import { EmailsysController } from './emailsys.controller';
import { EmailsysService } from './emailsys.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailsysEntity } from './entities/emailsy.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
});

const mockEmailsysService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
});

describe('EmailsysController', () => {
  let controller: EmailsysController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailsysController],
      providers: [
        {
          provide: EmailsysService,
          useValue: mockEmailsysService(),
        },
        {
          provide: getRepositoryToken(EmailsysEntity),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    controller = module.get<EmailsysController>(EmailsysController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
