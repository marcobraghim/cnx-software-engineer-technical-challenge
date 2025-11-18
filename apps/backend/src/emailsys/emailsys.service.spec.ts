import { Test, TestingModule } from '@nestjs/testing';
import { EmailsysService } from './emailsys.service';

describe('EmailsysService', () => {
  let service: EmailsysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailsysService],
    }).compile();

    service = module.get<EmailsysService>(EmailsysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
