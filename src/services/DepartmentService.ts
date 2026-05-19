import { AppDataSource } from '../database/data-source.js';
import { Department } from '../entities/Department.js';

export class DepartmentService {
  private repository = AppDataSource.getRepository(Department);

  async create(name: string, code: string) {
    // Verifica se já existe o nome ou o código
    const checkName = await this.repository.findOne({ where: { name } });
    if (checkName) throw new Error("Um departamento com este nome já existe.");

    const checkCode = await this.repository.findOne({ where: { code } });
    if (checkCode) throw new Error("Este código de departamento já está em uso.");

    const department = this.repository.create({ 
      name, 
      code 
    });

    return await this.repository.save(department);
  }

  async list() {
    return await this.repository.find({ order: { name: 'ASC' } });
  }
}