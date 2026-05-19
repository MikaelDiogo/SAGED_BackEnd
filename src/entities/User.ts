// src/entities/User.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import type { Demand } from "./Demand.js";
import { Department } from "./Department.js"; // Importe a entidade Department

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar", unique: true })
  email!: string;

  @Column({ type: "varchar", unique: true, nullable: true })
  lid!: string;

  @Column({ type: "varchar", select: false })
  password!: string;

  @Column({ type: "varchar", nullable: true })
  tech_type_code!: string | null;

  @Column({ type: "varchar", nullable: true })
  role!: string | null;

  @Column({ type: "boolean", default: false })
  is_sector_leader!: boolean;

  // --- ADICIONE ESTAS LINHAS ---
  @Column({ type: "uuid", nullable: true })
  departmentId!: string | null;

  @ManyToOne("Department")
  @JoinColumn({ name: "departmentId" })
  department!: any; // Use o tipo Department se preferir
  // ----------------------------

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany("Demand", "sender")
  demands_sent!: Demand[];

  @OneToMany("Demand", "technician")
  demands_assigned!: Demand[];
}