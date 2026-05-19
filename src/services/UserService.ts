import { hash } from "bcryptjs";
import { AppDataSource } from "../database/data-source.js";
import { User } from "../entities/User.js";

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: string;
  tech_type_code?: string;
  departmentId?: string | null;
  is_sector_leader?: boolean;
}

export class UserService {
  private repository = AppDataSource.getRepository(User);

  async create({
    name,
    email,
    password,
    role,
    tech_type_code,
    departmentId,
    is_sector_leader,
  }: CreateUserDTO) {
    const check = await this.repository.findOne({ where: { email } });
    if (check) throw new Error("Este usuário já está cadastrado.");

    const hashedPassword = await hash(password, 10);

    // SOLUÇÃO: Removido o código intruso e mapeado de acordo com as propriedades da entidade
    const user = this.repository.create({
      name,
      email,
      password: hashedPassword,
      tech_type_code: tech_type_code ?? undefined, // Ajustado para respeitar propriedades opcionais do TypeORM
      role,
      departmentId: departmentId ?? undefined,
      is_sector_leader: is_sector_leader ?? false,
    } as User);

    return await this.repository.save(user);
  }

  async findByEmail(email: string) {
    return await this.repository.findOne({ where: { email } });
  }
}