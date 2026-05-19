import type { CreateDemandData, CreateDemandPayload, IDemandRepository } from "../repositories/IDemandRepository.js";
import { ProtocolService } from "./protocol/ProtocolService.js";
import { DemandStatusUpdateService } from "./demand/DemandStatusUpdateService.js";
import type { UpdateDemandStatusInput } from "./demand/DemandStatusUpdateService.js";
import { ManagementReportService } from "./demand/ManagementReportService.js";
import { TechnicianWhatsAppSummaryService } from "./demand/TechnicianWhatsAppSummaryService.js";
import { NotificationService } from "./NotificationService.js";
import type { AuthenticatedUser } from "../types/auth.js";
import { resolveDemandListFilters } from "../policies/demand-visibility.policy.js";

export class DemandService {
  private readonly protocolService = new ProtocolService();
  private readonly statusUpdateService: DemandStatusUpdateService;
  private readonly managementReportService: ManagementReportService;
  private readonly whatsappSummaryService: TechnicianWhatsAppSummaryService;

  constructor(private readonly demandRepository: IDemandRepository) {
    const notifier = new NotificationService();
    this.statusUpdateService = new DemandStatusUpdateService(this.demandRepository, notifier);
    this.managementReportService = new ManagementReportService(this.demandRepository);
    this.whatsappSummaryService = new TechnicianWhatsAppSummaryService(this.demandRepository);
  }

  async executeCreate(data: CreateDemandPayload) {
    const dept = await this.demandRepository.findDepartmentById(data.departmentId);
    if (!dept) throw new Error("Departamento não encontrado.");

    const year = new Date().getFullYear();
    const deptCodeNorm = ProtocolService.normalizeSegment(dept.code);
    const techNorm = ProtocolService.normalizeSegment(data.techTypeCode);
    const prefix = this.protocolService.protocolPrefix(year, dept.code, data.techTypeCode);
    const count = await this.demandRepository.countByProtocolPrefix(prefix);
    const sequence = this.protocolService.nextSequence(count);
    const protocol = this.protocolService.buildProtocol(year, dept.code, data.techTypeCode, sequence);

    const payload: CreateDemandData = {
      ...data,
      techTypeCode: techNorm,
      deptCode: deptCodeNorm,
      protocol,
    };

    return await this.demandRepository.create(payload);
  }

  async updateTechnicalStatus(data: UpdateDemandStatusInput) {
    return this.statusUpdateService.execute(data);
  }

  async listForDashboard(user: AuthenticatedUser) {
    const filters = resolveDemandListFilters(user);

    // CORREÇÃO: Alterado de technicianId para technician_id para bater com o tipo DemandListFilters
    if (user.role === "TECNICO" && !user.isSectorLeader) {
      filters.technician_id = user.id;
    }

    return await this.demandRepository.findAllFiltered(filters);
  }

  async getDemandTimeline(demandId: string) {
    const demand = await this.demandRepository.findById(demandId);
    if (!demand) throw new Error("Demanda não encontrada.");
    return await this.demandRepository.findHistoryByDemand(demandId);
  }

  async getTechnicianSummaryByLid(lid: string) {
    return this.whatsappSummaryService.executeByLid(lid);
  }

  async generateManagementReport(
    user: AuthenticatedUser,
    month: number,
    year: number,
    targetDeptId?: string,
  ) {
    return this.managementReportService.generate(user, month, year, targetDeptId);
  }
}