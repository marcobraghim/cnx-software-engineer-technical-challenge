import { Test, TestingModule } from '@nestjs/testing';
import { SendEmailsController } from './send-emails.controller';
import { SendEmailsService } from './send-emails.service';
import { EmailsysItemService } from './services/emailsys.item.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailserviceapiEntity } from './entities/emailserviceapi.entity';
import { EmailsysItemEntity } from './entities/emailsys_item.entity';

const mockRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
});

const mockSendEmailsService = () => ({
  ensureValidEmailServiceToken: jest.fn(),
  sendEmail: jest.fn(),
});

const mockEmailsysItemService = () => ({
  getEmailsToSend: jest.fn(),
  updateStatus: jest.fn(),
});

describe('SendEmailsController', () => {
  let controller: SendEmailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SendEmailsController],
      providers: [
        {
          provide: SendEmailsService,
          useValue: mockSendEmailsService(),
        },
        {
          provide: EmailsysItemService,
          useValue: mockEmailsysItemService(),
        },
        {
          provide: getRepositoryToken(EmailserviceapiEntity),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(EmailsysItemEntity),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    controller = module.get<SendEmailsController>(SendEmailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
