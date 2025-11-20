import { Test, TestingModule } from '@nestjs/testing';
import { SendEmailsService } from './send-emails.service';

describe('SendEmailsService', () => {
  let service: SendEmailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SendEmailsService],
    }).compile();

    service = module.get<SendEmailsService>(SendEmailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
