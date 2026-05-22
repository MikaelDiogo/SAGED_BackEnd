import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("specialties")
export class Specialty {
  @PrimaryGeneratedColumn("uuid")
  id!: string; // Adicionado o !

  @Column({ type: "varchar", unique: true })
  code!: string; // Adicionado o !

  @Column({ type: "varchar" })
  name!: string; // Adicionado o !

  @CreateDateColumn()
  created_at!: Date; // Adicionado o !

  @UpdateDateColumn()
  updated_at!: Date; // Adicionado o !
}