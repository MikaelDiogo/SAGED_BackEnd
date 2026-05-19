import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from 'dotenv';

// Importe suas Entities
import { User } from "../entities/User.js";
import { Demand } from "../entities/Demand.js";
import { Department } from "../entities/Department.js";
import { DemandHistory } from "../entities/DemandHistory.js";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    // O "as string" resolve o erro 2345, garantindo ao TS que o valor virá do .env
    url: process.env.DATABASE_URL as string,
    
    synchronize: true, 
    logging: false,
    
    entities: [User, Demand, Department, DemandHistory],
    subscribers: [],
    migrations: [],
});