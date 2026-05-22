import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from 'dotenv';

// Importe suas Entities
import { User } from "../entities/User.js";
import { Demand } from "../entities/Demand.js";
import { Department } from "../entities/Department.js";
import { DemandHistory } from "../entities/DemandHistory.js";
import { Specialty } from "../entities/Specialty.js";

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    throw new Error("❌ ERRO FATAL: DATABASE_URL não definida no .env");
}

export const AppDataSource = new DataSource({
    type: "postgres",
    url: dbUrl, 
    
    synchronize: false, // Desativado para evitar perda de dados e schema drift
    logging: false,
    entities: [User, Demand, Department, DemandHistory, Specialty],
    subscribers: [],
    migrations: ["src/database/migrations/*.ts"],
});