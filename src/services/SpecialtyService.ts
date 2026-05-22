import { AppDataSource } from "../database/data-source.js";
import { Specialty } from "../entities/Specialty.js";

export class SpecialtyService {
  private specialtyRepository = AppDataSource.getRepository(Specialty);

  async listAll() {
    return await this.specialtyRepository.find({ order: { code: "ASC" } });
  }

  async createSpecialty(code: string, name: string) {
    // Evita duplicados
    const exists = await this.specialtyRepository.findOneBy({ code });
    if (exists) {
      throw new Error("Especialidade já cadastrada.");
    }

    const specialty = this.specialtyRepository.create({ 
      code, 
      name: name.toUpperCase() 
    });

    return await this.specialtyRepository.save(specialty);
  }
}