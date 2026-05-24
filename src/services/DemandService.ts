import type { CreateDemandData, CreateDemandPayload, IDemandRepository } from "../repositories/IDemandRepository.js";
import { ProtocolService } from "./protocol/ProtocolService.js";
import { DemandStatusUpdateService } from "./demand/DemandStatusUpdateService.js";
import { ManagementReportService } from "./demand/ManagementReportService.js";
import { TechnicianWhatsAppSummaryService } from "./demand/TechnicianWhatsAppSummaryService.js";
import { NotificationService } from "./NotificationService.js";
import type { AuthenticatedUser } from "../types/auth.js";
import { assertDemandAccess, resolveDemandListFilters } from "../policies/demand-visibility.policy.js";
import { AppDataSource } from "../database/data-source.js";
import { Demand } from "../entities/Demand.js";
import { UserRole } from "../constants/user-roles.js";
import { AccessDeniedError } from "../errors/AccessDeniedError.js";

export interface UpdateTechnicalStatusInput {
  demandId: string;
  user: AuthenticatedUser;
  status: string;
  description?: string;
  asset_tag?: string;
}

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
    // FIX R-02: Validação de IDOR. Impede que técnicos/líderes criem demandas para outros departamentos.
    if (data.user.role !== UserRole.ADMIN_GERAL) {
      if (data.departmentId !== data.user.departmentId) {
        throw new AccessDeniedError("Você não pode abrir demandas para outra secretaria.");
      }
    }

    return await AppDataSource.transaction(async (transactionalEntityManager) => {
      const dept = await this.demandRepository.findDepartmentById(data.departmentId);
      if (!dept) throw new Error("Departamento não encontrado.");

      const year = new Date().getFullYear();
      const prefix = this.protocolService.protocolPrefix(year, dept.code, data.techTypeCode);

      // FIX: Race Condition. Usamos lock pessimista para garantir que protocolos não dupliquem
      // se duas requisições chegarem ao mesmo tempo.
      const lastDemand = await transactionalEntityManager.createQueryBuilder(Demand, "demand")
        .setLock("pessimistic_write")
        .where("demand.protocol LIKE :prefix", { prefix: `${prefix}%` })
        .orderBy("demand.protocol", "DESC")
        .getOne();

      let lastSequence = 0;
      if (lastDemand) {
        const parts = lastDemand.protocol.split("-");
        lastSequence = parseInt(parts[parts.length - 1] || "0", 10);
      }

      const sequence = this.protocolService.nextSequence(lastSequence);
      const protocol = this.protocolService.buildProtocol(year, dept.code, data.techTypeCode, sequence);

      // Removemos o objeto 'user' do payload para coincidir com a interface CreateDemandData do repositório
      const { user, ...cleanData } = data;

      const payload: CreateDemandData = {
        ...cleanData,
        techTypeCode: ProtocolService.normalizeSegment(data.techTypeCode),
        deptCode: ProtocolService.normalizeSegment(dept.code),
        protocol,
      };

      return await this.demandRepository.create(payload);
    });
  }

  async updateTechnicalStatus(data: UpdateTechnicalStatusInput) {
    const demand = await this.demandRepository.findById(data.demandId);
    if (!demand) throw new Error("Demanda não encontrada.");

    // FIX: IDOR. O serviço agora valida se o usuário tem permissão sobre esta demanda específica.
    assertDemandAccess(data.user, demand);

    // FIX: Mapeamento explícito para evitar que technicianId chegue undefined (anteriormente oculto por 'as any')
    return this.statusUpdateService.execute({
      demandId: data.demandId,
      technicianId: data.user.id,
      status: data.status,
      description: data.description,
      asset_tag: data.asset_tag,
    });
  }

  async listForDashboard(user: AuthenticatedUser, page: number, limit: number) {
    const filters = resolveDemandListFilters(user);

    // FIX: Uso da constante UserRole para manter a consistência do RBAC
    if (user.role === UserRole.TECNICO && !user.isSectorLeader) {
      filters.technician_id = user.id;
    }

    return await this.demandRepository.findAllFiltered(filters, page, limit);
  }

  async getDemandTimeline(demandId: string, user: AuthenticatedUser) {
    const demand = await this.demandRepository.findById(demandId);
    if (!demand) throw new Error("Demanda não encontrada.");

    // FIX: IDOR. Valida visibilidade antes de expor o histórico de auditoria.
    assertDemandAccess(user, demand);

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