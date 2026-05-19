import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import type { Demand } from "./Demand.js";

@Entity("departments")
export class Department {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" }) 
  name!: string;

  @Column({ type: "varchar", unique: true })
  code!: string; 

  @OneToMany("Demand", "department")
  demands!: Demand[];
}