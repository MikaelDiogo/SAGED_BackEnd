import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  JoinColumn 
} from "typeorm";
import type { User } from "./User.js";
import type { Department } from "./Department.js";

@Entity("demands")
export class Demand {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", unique: true })
  protocol!: string; 

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", default: "A_FAZER" })
  status!: string;

  @Column({ type: "boolean", default: false })
  viewed!: boolean;

  @Column({ type: "varchar", nullable: true })
  asset_tag?: string;

  @Column({ type: "varchar" })
  deptCode!: string;

  @Column({ type: "varchar" })
  techTypeCode!: string;

  @Column({ type: "varchar" })
  senderId!: string;

  @ManyToOne("User", "demands_sent")
  @JoinColumn({ name: "senderId" })
  sender!: User;

  @Column({ type: "varchar", nullable: true })
  current_technician_id?: string;

  @ManyToOne("User", "demands_assigned")
  @JoinColumn({ name: "current_technician_id" })
  technician?: User;

  @Column({ type: "varchar" })
  departmentId!: string;

  @ManyToOne("Department", "demands")
  @JoinColumn({ name: "departmentId" })
  department!: Department;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}