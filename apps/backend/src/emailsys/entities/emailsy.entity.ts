import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./user.entity";

@Entity({ name: 'emailsys' })
export class EmailsysEntity {

  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => UserEntity, { nullable: false, eager: true })
  @JoinColumn({ name: 'fk_user' })
  user: UserEntity

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date
}
