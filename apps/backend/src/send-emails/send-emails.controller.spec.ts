import { Test, TestingModule } from '@nestjs/testing';
import { SendEmailsController } from './send-emails.controller';
import { SendEmailsService } from './send-emails.service';

describe('SendEmailsController', () => {
  let controller: SendEmailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SendEmailsController],
      providers: [SendEmailsService],
    }).compile();

    controller = module.get<SendEmailsController>(SendEmailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
