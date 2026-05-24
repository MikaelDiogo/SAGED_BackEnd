import type { AuthenticatedUser } from "../types/auth.js";

export interface CreateDemandData {
  protocol: string;
  title: string;
  description: string;
  senderId: string;
  departmentId: string;
  deptCode: string;
  techTypeCode: string;
  asset_tag?: string;
}

export type CreateDemandPayload = Omit<CreateDemandData, "protocol" | "deptCode"> & {
  user: AuthenticatedUser;
};

export type DemandHistoryEntry = {
  demandId: string;
  technicianId: string;
  previousStatus: string | null;
  status: string;
  description: string;
};

export interface IDemandRepository {
  create(data: CreateDemandData): Promise<any>;
  findById(id: string): Promise<any | null>;
  updateStatus(id: string, status: string, technicianId?: string, asset_tag?: string): Promise<void>;
  addHistory(data: DemandHistoryEntry): Promise<void>;
  listByTechType(techTypeCode: string): Promise<any[]>;
  countByProtocolPrefix(prefix: string): Promise<number>;
  findDepartmentById(id: string): Promise<{ code: string } | null>;
  updateViewStatus(id: string, viewed: boolean): Promise<void>;
  findAllFiltered(
    filters: any, 
    page: number, 
    limit: number
  ): Promise<any[]>;
  findHistoryByDemand(demandId: string): Promise<any[]>;
  getReportData(filters: { departmentId?: string; startDate: Date; endDate: Date }): Promise<any[]>;
}

// assingment update