import { AppDataSource } from '../../database/data-source.js';
import { Demand } from '../../entities/Demand.js';
import { Department } from '../../entities/Department.js';
import { DemandHistory } from '../../entities/DemandHistory.js';
import type { IDemandRepository, CreateDemandData, DemandHistoryEntry } from '../IDemandRepository.js';

export class TypeORMDemandRepository implements IDemandRepository {
  private repository = AppDataSource.getRepository(Demand);
  private deptRepository = AppDataSource.getRepository(Department);
  private historyRepository = AppDataSource.getRepository(DemandHistory);

  async create(data: CreateDemandData) {
    const demand = this.repository.create(data);
    return await this.repository.save(demand);
  }

  async findById(id: string) {
    return await this.repository.findOne({ 
      where: { id },
      relations: ['sender', 'department'] 
    });
  }

  async findDepartmentById(id: string) {
    return await this.deptRepository.findOne({ 
      where: { id },
      select: ["code"] 
    });
  }

  async countByProtocolPrefix(prefix: string) {
    return await this.repository
      .createQueryBuilder("demand")
      .where("demand.protocol LIKE :prefix", { prefix: `${prefix}%` })
      .getCount();
  }

  async updateStatus(id: string, status: string, technicianId?: string, asset_tag?: string) {
    await this.repository.update(id, {
      status,
      current_technician_id: technicianId || null, 
      asset_tag: asset_tag || null,
      viewed: true,
      updated_at: new Date()
    } as import("typeorm/query-builder/QueryPartialEntity.js").QueryDeepPartialEntity<Demand>);
  }

  async addHistory(data: DemandHistoryEntry) {
    const history = this.historyRepository.create({
      demandId: data.demandId,
      technicianId: data.technicianId,
      previous_status: data.previousStatus,
      status: data.status,
      description: data.description,
    });
    await this.historyRepository.save(history);
  }

  async listByTechType(techTypeCode: string) {
    return await this.repository.find({
      where: { techTypeCode },
      relations: ['sender', 'department'],
      order: { created_at: 'DESC' }
    });
  }

  async updateViewStatus(id: string, viewed: boolean) {
    await this.repository.update(id, { viewed });
  }

async findAllFiltered(filters: any, page: number, limit: number) {
    console.log("=== FILTROS ENTRANDO NO REPOSITÓRIO ===", filters);

    const query = this.repository.createQueryBuilder("demand")
      .leftJoinAndSelect("demand.sender", "sender")
      .leftJoinAndSelect("demand.department", "department")
      .leftJoinAndSelect("demand.technician", "technician")
      .orderBy("demand.created_at", "DESC");

    // 1. Filtro de Secretaria
    const deptId = filters.departmentId || filters.department_id;
    if (deptId) {
      query.andWhere("demand.departmentId = :deptId", { deptId });
    }

    // 2. Filtro de Status
    if (filters.status) {
      query.andWhere("demand.status = :status", { status: filters.status });
    }

    // 3. Filtro de Especialidade (Fila)
    const code = filters.techTypeCode || filters.tech_type_code;
    if (code && code !== "SEM_FILA" && code !== "SEM_FILA_CADASTRADA") {
      query.andWhere("demand.techTypeCode = :techTypeCode", { techTypeCode: code });
    }

    // 4. FILTRO DE VÍNCULO CORRIGIDO (Usando aliases seguros do TypeORM)
    const techId = filters.technicianId || filters.technician_id;
    if (techId) {
      // Regra corrigida: traz se o ID do técnico associado for igual ao logado 
      // OU se o campo de relacionamento estiver completamente vazio (fila geral)
      query.andWhere(
        "(technician.id = :techId OR demand.current_technician_id IS NULL)",
        { techId }
      );
    }

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);
    const result = await query.getMany();
    console.log(`=== SUCESSO: BANCO RETORNOU ${result.length} DEMANDAS PARA O FILTRO ===`);
    return result;
  }

  async findHistoryByDemand(demandId: string) {
    return await this.historyRepository.find({
      where: { demandId },
      relations: ['technician'],
      order: { created_at: 'ASC' }
    });
  }

  async getReportData(filters: { departmentId?: string; startDate: Date; endDate: Date }) {
    const query = this.repository.createQueryBuilder("demand")
      .leftJoinAndSelect("demand.technician", "technician")
      .leftJoinAndSelect("demand.department", "department")
      .where("demand.created_at BETWEEN :start AND :end", { 
        start: filters.startDate, 
        end: filters.endDate 
      });

    if (filters.departmentId) {
      query.andWhere("(demand.departmentId = :departmentId OR demand.department_id = :departmentId)", { departmentId: filters.departmentId });
    }

    return await query.getMany();
  }
}