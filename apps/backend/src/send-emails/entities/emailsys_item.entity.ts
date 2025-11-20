import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EmailsysEntity } from '../../emailsys/entities/emailsy.entity';

@Entity({ name: 'emailsys_item' })
export class EmailsysItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => EmailsysEntity, { nullable: false })
  @JoinColumn({ name: 'fk_emailsys' })
  emailsys: EmailsysEntity;

  @Column({ name: 'emailto', type: 'varchar', nullable: false })
  emailTo: string;

  @Column({ type: 'varchar', nullable: false })
  status: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

