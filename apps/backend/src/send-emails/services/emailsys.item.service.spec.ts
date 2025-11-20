import { Test, TestingModule } from '@nestjs/testing';
import { EmailsysItemService } from './emailsys.item.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailsysItemEntity } from '../entities/emailsys_item.entity';
import { EmailsysItemStatus } from '../enums/emailsys-item-status.enum';

const mockRepository = () => ({
  find: jest.fn(),
  update: jest.fn(),
});

describe('EmailsysItemService', () => {
  let service: EmailsysItemService;
  let repository: ReturnType<typeof mockRepository>;

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
    repository = module.get(getRepositoryToken(EmailsysItemEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEmailsToSend', () => {
    it('should return emails with pending status', async () => {
      const mockEmails: EmailsysItemEntity[] = [
        {
          id: 1,
          emailTo: 'user1@example.com',
          status: EmailsysItemStatus.Pending,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          emailsys: {} as any,
        },
        {
          id: 2,
          emailTo: 'user2@example.com',
          status: EmailsysItemStatus.Pending,
          created_at: new Date('2024-01-02'),
          updated_at: new Date('2024-01-02'),
          emailsys: {} as any,
        },
      ];

      repository.find.mockResolvedValue(mockEmails);

      const result = await service.getEmailsToSend(10);

      expect(result).toEqual(mockEmails);
      expect(repository.find).toHaveBeenCalledWith({
        where: { status: EmailsysItemStatus.Pending },
        order: { created_at: 'ASC' },
        take: 10,
        relations: ['emailsys'],
      });
    });

    it('should respect the limit parameter', async () => {
      const mockEmails: EmailsysItemEntity[] = [
        {
          id: 1,
          emailTo: 'user1@example.com',
          status: EmailsysItemStatus.Pending,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          emailsys: {} as any,
        },
      ];

      repository.find.mockResolvedValue(mockEmails);

      await service.getEmailsToSend(5);

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });

    it('should order by created_at ASC', async () => {
      repository.find.mockResolvedValue([]);

      await service.getEmailsToSend(10);

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { created_at: 'ASC' },
        }),
      );
    });

    it('should include emailsys relation', async () => {
      repository.find.mockResolvedValue([]);

      await service.getEmailsToSend(10);

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['emailsys'],
        }),
      );
    });

    it('should return empty array when no pending emails exist', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.getEmailsToSend(10);

      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update email status to processing', async () => {
      repository.update.mockResolvedValue({ affected: 1 });

      await service.updateStatus(1, EmailsysItemStatus.Processing);

      expect(repository.update).toHaveBeenCalledWith(1, {
        status: EmailsysItemStatus.Processing,
      });
    });

    it('should update email status to sent', async () => {
      repository.update.mockResolvedValue({ affected: 1 });

      await service.updateStatus(1, EmailsysItemStatus.Sent);

      expect(repository.update).toHaveBeenCalledWith(1, {
        status: EmailsysItemStatus.Sent,
      });
    });

    it('should update email status to error', async () => {
      repository.update.mockResolvedValue({ affected: 1 });

      await service.updateStatus(1, EmailsysItemStatus.Error);

      expect(repository.update).toHaveBeenCalledWith(1, {
        status: EmailsysItemStatus.Error,
      });
    });

    it('should update email status to pending', async () => {
      repository.update.mockResolvedValue({ affected: 1 });

      await service.updateStatus(1, EmailsysItemStatus.Pending);

      expect(repository.update).toHaveBeenCalledWith(1, {
        status: EmailsysItemStatus.Pending,
      });
    });

    it('should handle update for non-existent email ID', async () => {
      repository.update.mockResolvedValue({ affected: 0 });

      await service.updateStatus(999, EmailsysItemStatus.Sent);

      expect(repository.update).toHaveBeenCalledWith(999, {
        status: EmailsysItemStatus.Sent,
      });
    });
  });
});
