import { Test, TestingModule } from '@nestjs/testing';
import { EmailsysController } from './emailsys.controller';
import { EmailsysService } from './emailsys.service';

describe('EmailsysController', () => {
  let controller: EmailsysController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailsysController],
      providers: [EmailsysService],
    }).compile();

    controller = module.get<EmailsysController>(EmailsysController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
