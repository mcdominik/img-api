import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('images')
export class ImageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 2048 })
  url: string;

  @Column('int')
  width: number;

  @Column('int')
  height: number;

  @CreateDateColumn()
  createdAt: Date;
}
