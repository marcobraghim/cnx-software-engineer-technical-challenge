import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'emailserviceapi' })
export class EmailserviceapiEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  jwttoken: string

  @Column({ nullable: false })
  expiration: Date

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date
}