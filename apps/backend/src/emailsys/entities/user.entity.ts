import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'user' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  name: string

  @Column({ nullable: false })
  email: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date
}