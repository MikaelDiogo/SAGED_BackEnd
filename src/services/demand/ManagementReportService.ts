import type { IDemandRepository } from "../../repositories/IDemandRepository.js";
import type { AuthenticatedUser } from "../../types/auth.js";
import {
  assertManagementReportAllowed,
  resolveReportDepartmentFilter,
} from "../../policies/demand-visibility.policy.js";
import { DemandStatus } from "../../constants/demand-status.js";

export type ManagementReportResult = {
  period: string;
  scope: string;
  metrics: {
    total: number;
    resolutionRate: string | number;
    avgTime: string;
    interrupted: number;
  };
  statusCounts: Record<string, number>;
  technicians: Array<{ name: string; count: number; concluded: number }>;
};

/**
 * Agrega indicadores do período para dashboard / exportação PDF.
 */
export class ManagementReportService {
  constructor(private readonly demandRepository: IDemandRepository) {}

  async generate(
    user: AuthenticatedUser,
    month: number,
    year: number,
    targetDepartmentId?: string,
  ): Promise<ManagementReportResult> {
    assertManagementReportAllowed(user);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Corrigido o mapeamento do parâmetro 'isSectorLeader' recebido do 'user'
    const departmentId = resolveReportDepartmentFilter({
      role: user.role,
      ...(user.departmentId ? { userDepartmentId: user.departmentId } : {}),
      ...(targetDepartmentId ? { targetDepartmentId } : {}),
      isSectorLeader: user.isSectorLeader ?? false,
    });

    const reportFilters: { startDate: Date; endDate: Date; departmentId?: string } = {
      startDate,
      endDate,
    };
    if (departmentId) {
      reportFilters.departmentId = departmentId;
    }
    const demands = await this.demandRepository.getReportData(reportFilters);

    const total = demands.length;
    const concluded = demands.filter((d: { status: string }) => d.status === DemandStatus.CONCLUIDO);
    const interrupted = demands.filter(
      (d: { status: string }) =>
        d.status === DemandStatus.INTERROMPIDO || d.status === DemandStatus.CANCELADO,
    ).length;
    const resolutionRate = total > 0 ? ((concluded.length / total) * 100).toFixed(1) : "0";

    let totalHours = 0;
    concluded.forEach((d: { updated_at: Date; created_at: Date }) => {
      const diff = d.updated_at.getTime() - d.created_at.getTime();
      totalHours += diff / (1000 * 60 * 60);
    });
    const avgTime = concluded.length > 0 ? (totalHours / concluded.length).toFixed(1) : "0";

    const techMap: Record<string, { total: number; concluidos: number }> = {};
    demands.forEach((d: { technician?: { name: string }; status: string }) => {
      if (d.technician) {
        const key = d.technician.name;
        if (!techMap[key]) techMap[key] = { total: 0, concluidos: 0 };
        techMap[key].total++;
        if (d.status === DemandStatus.CONCLUIDO) techMap[key].concluidos++;
      }
    });

    const scope = departmentId
      ? `Secretaria ID: ${departmentId}`
      : "Geral (Todas as Secretarias)";

    const statusCounts: Record<string, number> = {};
    demands.forEach((d: { status: string }) => {
      statusCounts[d.status] = (statusCounts[d.status] ?? 0) + 1;
    });

    return {
      period: `${month}/${year}`,
      scope,
      metrics: {
        total,
        resolutionRate,
        avgTime: `${avgTime}h`,
        interrupted,
      },
      statusCounts,
      technicians: Object.keys(techMap).map((name) => ({
        name,
        count: techMap[name]!.total,
        concluded: techMap[name]!.concluidos,
      })),
    };
  }
}