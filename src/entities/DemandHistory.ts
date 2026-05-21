import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import type { Demand } from "./Demand.js";
import type { User } from "./User.js";

@Entity("demand_history")
@Index(["demandId"])
export class DemandHistory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  demandId!: string;

  @ManyToOne("Demand")
  @JoinColumn({ name: "demandId" })
  demand!: Demand;

  @Column({ type: "varchar" })
  technicianId!: string;

  @ManyToOne("User")
  @JoinColumn({ name: "technicianId" })
  technician!: User;

  @Column({ type: "varchar", nullable: true })
  previous_status!: string | null;

  @Column({ type: "varchar" })
  status!: string;

  @Column({ type: "text" })
  description!: string;

  @CreateDateColumn()
  created_at!: Date;
}

// demand history update
