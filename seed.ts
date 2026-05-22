// @ts-ignore
import { AppDataSource } from "./src/database/data-source.js";
// @ts-ignore
import { Specialty } from "./src/entities/Specialty.js";
// @ts-ignore
import { Department } from "./src/entities/Department.js";
// @ts-ignore
import { User } from "./src/entities/User.js";
import bcrypt from "bcryptjs";

const specialtiesData = [
  { code: "01", name: "HARDWARE" },
  { code: "02", name: "REDES" }
];

const techniciansData = [
  { name: "Carlos Augusto (Hardware)", email: "carlos.hardware@saged.com.br", tech_type_code: "01" },
  { name: "Bruno Souza (Hardware)", email: "bruno.hardware@saged.com.br", tech_type_code: "01" },
  { name: "Fernanda Lima (Redes)", email: "fernanda.redes@saged.com.br", tech_type_code: "02" },
  { name: "Gabriel Costa (Redes)", email: "gabriel.redes@saged.com.br", tech_type_code: "02" }
];

async function rodarSeedDireto() {
  console.log("🚀 [SAGE] Inicializando conexão direta com o Banco de Dados...");
  
  try {
    // 1. Inicializa o Data Source do TypeORM
    await AppDataSource.initialize();
    console.log("✅ Conexão com o banco estabelecida com sucesso!");

    const specialtyRepository = AppDataSource.getRepository(Specialty);
    const departmentRepository = AppDataSource.getRepository(Department);
    const userRepository = AppDataSource.getRepository(User);

    // 2. Inserir Especialidades
    console.log("\n🛠️ Verificando Especialidades...");
    for (const spec of specialtiesData) {
      const exists = await specialtyRepository.findOneBy({ code: spec.code });
      if (!exists) {
        const newSpec = specialtyRepository.create({ code: spec.code, name: spec.name });
        await specialtyRepository.save(newSpec);
        console.log(`  ➕ Especialidade adicionada: ${spec.name}`);
      } else {
        console.log(`  ⚠️ Especialidade ${spec.name} já existe.`);
      }
    }

    // 3. Garantir a existência de uma Secretaria Base
    console.log("\n📁 Verificando Secretaria base...");
    let dept = await departmentRepository.findOneBy({ code: "06" });
    
    if (!dept) {
      dept = departmentRepository.create({
        name: "Sec. de Planejamento e Tecnologia da Informação",
        code: "06"
      });
      await departmentRepository.save(dept);
      console.log("  ✨ Secretaria '06' criada com sucesso!");
    } else {
      console.log(`  🎯 Secretaria base encontrada: ${dept.name}`);
    }

    // 4. Inserir Técnicos (Criptografando a senha manualmente)
    console.log("\n👨‍💻 Cadastrando equipe técnica no banco...");
    const passwordHash = await bcrypt.hash("saged123", 8);

    for (const tech of techniciansData) {
      const userExists = await userRepository.findOneBy({ email: tech.email });
      
      if (!userExists) {
        const newTech = userRepository.create({
          name: tech.name,
          email: tech.email,
          password: passwordHash,
          role: "TECNICO",
          tech_type_code: tech.tech_type_code,
          is_sector_leader: false,
          departmentId: dept.id
        });
        
        await userRepository.save(newTech);
        console.log(`  👤 Técnico Criado: ${tech.email}`);
      } else {
        console.log(`  ⚠️ Técnico ${tech.email} já está cadastrado.`);
      }
    }

    console.log("\n🏁 [SAGE] População via DB finalizada com 100% de sucesso!");

  } catch (error) {
    console.error("❌ Erro fatal durante o seed direto:", error);
  } finally {
    // Fecha a conexão para o terminal não ficar travado eterno
    await AppDataSource.destroy();
  }
}

rodarSeedDireto();