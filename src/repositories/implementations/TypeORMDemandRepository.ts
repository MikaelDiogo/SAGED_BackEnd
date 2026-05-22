import { AppDataSource } from '../../database/data-source.js';
import { Demand } from '../../entities/Demand.js';
import { Department } from '../../entities/Department.js';
import { DemandHistory } from '../../entities/DemandHistory.js';
import type { IDemandRepository, CreateDemandData, DemandHistoryEntry } from '../IDemandRepository.js';
import type { ObjectLiteral } from 'typeorm';

export class TypeORMDemandRepository implements IDemandRepository {
  private readonly repository = AppDataSource.getRepository(Demand);
  private readonly deptRepository = AppDataSource.getRepository(Department);
  private readonly historyRepository = AppDataSource.getRepository(DemandHistory);

  async create(data: CreateDemandData): Promise<Demand> {
    const demand = this.repository.create(data);
    return await this.repository.save(demand);
  }

  async findById(id: string): Promise<Demand | null> {
    if (!id) return null;
    
    return await this.repository.findOne({ 
      where: { id },
      relations: ['sender', 'department'] 
    });
  }

  async findDepartmentById(id: string): Promise<Department | null> {
    if (!id) return null;

    return await this.deptRepository.findOne({ 
      where: { id },
      select: ["code"] 
    });
  }

  async countByProtocolPrefix(prefix: string): Promise<number> {
    if (!prefix) return 0;

    // Sanitização defensiva para evitar wildcards maliciosos no LIKE
    const sanitizedPrefix = prefix.replace(/[%_]/g, '\\$&');

    return await this.repository
      .createQueryBuilder("demand")
      .where("demand.protocol LIKE :prefix", { prefix: `${sanitizedPrefix}%` })
      .getCount();
  }

  async updateStatus(id: string, status: string, technicianId?: string, asset_tag?: string): Promise<void> {
    if (!id) return;

    await this.repository.update(id, {
      status,
      current_technician_id: technicianId || null, 
      asset_tag: asset_tag || null,
      viewed: true,
      updated_at: new Date()
    } as import("typeorm/query-builder/QueryPartialEntity.js").QueryDeepPartialEntity<Demand>);
  }

  async addHistory(data: DemandHistoryEntry): Promise<void> {
    const history = this.historyRepository.create({
      demandId: data.demandId,
      technicianId: data.technicianId,
      previous_status: data.previousStatus,
      status: data.status,
      description: data.description,
    });
    await this.historyRepository.save(history);
  }

  async listByTechType(techTypeCode: string): Promise<Demand[]> {
    if (!techTypeCode) return [];

    return await this.repository.find({
      where: { techTypeCode },
      relations: ['sender', 'department'],
      order: { created_at: 'DESC' }
    });
  }

  async updateViewStatus(id: string, viewed: boolean): Promise<void> {
    if (!id) return;
    await this.repository.update(id, { viewed });
  }

  async findAllFiltered(filters: ObjectLiteral, page: number, limit: number): Promise<Demand[]> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit)); // Proteção contra sobrecarga de memória (DoS)

    const query = this.repository.createQueryBuilder("demand")
      .leftJoinAndSelect("demand.sender", "sender")
      .leftJoinAndSelect("demand.department", "department")
      .leftJoinAndSelect("demand.technician", "technician")
      .orderBy("demand.created_at", "DESC");

    // 1. Filtro de Secretaria (Uso exclusivo da propriedade mapeada na Entidade)
    const deptId = filters?.departmentId || filters?.department_id;
    if (deptId) {
      query.andWhere("demand.departmentId = :deptId", { deptId });
    }

    // 2. Filtro de Status
    if (filters?.status) {
      query.andWhere("demand.status = :status", { status: filters.status });
    }

    // 3. Filtro de Especialidade (Fila)
    const code = filters?.techTypeCode || filters?.tech_type_code;
    if (code && code !== "SEM_FILA" && code !== "SEM_FILA_CADASTRADA") {
      query.andWhere("demand.techTypeCode = :techTypeCode", { techTypeCode: code });
    }

    // 4. Filtro de Vínculo Técnico Seguro
    const techId = filters?.technicianId || filters?.technician_id;
    if (techId) {
      query.andWhere(
        "(technician.id = :techId OR demand.current_technician_id IS NULL)",
        { techId }
      );
    }

    const skip = (safePage - 1) * safeLimit;
    query.skip(skip).take(safeLimit);

    return await query.getMany();
  }

  async findHistoryByDemand(demandId: string): Promise<DemandHistory[]> {
    if (!demandId) return [];

    return await this.historyRepository.find({
      where: { demandId },
      relations: ['technician'],
      order: { created_at: 'ASC' }
    });
  }

  async getReportData(filters: { departmentId?: string; startDate: Date; endDate: Date }): Promise<Demand[]> {
    const query = this.repository.createQueryBuilder("demand")
      .leftJoinAndSelect("demand.technician", "technician")
      .leftJoinAndSelect("demand.department", "department")
      .where("demand.created_at BETWEEN :start AND :end", { 
        start: filters.startDate, 
        end: filters.endDate 
      });

    // CORREÇÃO CRÍTICA: Removido a propriedade física inválida "demand.department_id"
    if (filters.departmentId) {
      query.andWhere("demand.departmentId = :reportDeptId", { reportDeptId: filters.departmentId });
    }

    return await query.getMany();
  }
}