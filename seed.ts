import axios from 'axios';

const secretariasData = [
  { name: "Gabinete da(o) Prefeita(o)", code: "01" },
  { name: "Gabinete do(a) Vice-Prefeito(a)", code: "01.01" },
  { name: "Secretaria Municipal de Governo", code: "02" },
  { name: "Procuradoria Geral do Município", code: "03" },
  { name: "Controladoria Geral do Município", code: "04" },
  { name: "Sec. de Administração, Finanças e Orçamento", code: "05" },
  { name: "Sec. de Planejamento e Tecnologia da Informação", code: "06" },
  { name: "Secretaria Municipal de Educação", code: "07" },
  { name: "Secretaria Municipal de Saúde", code: "08" },
  { name: "Secretaria Municipal de Assistência Social", code: "09" },
  { name: "Sec. de Comunicação Social e Relações Públicas", code: "10" },
  { name: "Secretaria Municipal de Segurança Cidadã e Trânsito", code: "11" },
  { name: "Secretaria Municipal de Cultura", code: "12" },
  { name: "Sec. de Proteção à Mulher e à Família", code: "13" },
  { name: "Secretaria Municipal de Esporte e Lazer", code: "14" },
  { name: "Sec. de Des. Econômico, Empreendedorismo e Trabalho", code: "15" },
  { name: "Secretaria Municipal do Turismo", code: "16" },
  { name: "Sec. de Desenvolvimento Agrário e Pecuário", code: "17" },
  { name: "Sec. de Infância, Adolescência e Juventude", code: "18" },
  { name: "Sec. de Recursos Hídricos e Defesa Civil", code: "19" },
  { name: "Sec. de Infraestrutura e Serviços Públicos", code: "20" },
  { name: "Secretaria Municipal de Meio Ambiente", code: "21" },
  { name: "Secretaria Municipal de Desenvolvimento Regional", code: "22" }
];

const API_URL = 'http://localhost:3333';
const PADRAO_SENHA = 'saged123';

async function rodarPopulacao() {
  console.log("🚀 [SAGE] Iniciando seed automático de Secretarias via Requisições de API...");

  for (const sec of secretariasData) {
    try {
      // 1. Cadastra a Secretaria via API
      const resDept = await axios.post(`${API_URL}/departments`, {
        name: sec.name,
        code: sec.code
      });
      
      const deptCriado = resDept.data;
      console.log(`\n📁 Secretaria Cadastrada: [${deptCriado.code}] - ${deptCriado.name}`);

      const nomeLimpo = sec.name.replace("Sec. de ", "").replace("Secretaria Municipal de ", "");

      // 2. Define o payload com o papel de ADMIN_SETOR e e-mail sec.codigo@
      const payloadUsuario = {
        name: `Admin - ${nomeLimpo}`,
        email: `sec.${sec.code}@saged.com.br`,
        password: PADRAO_SENHA,
        role: "ADMIN_SETOR",
        tech_type_code: "01", 
        is_sector_leader: false,
        departmentId: deptCriado.id
      };

      // 3. Cadastra o Usuário Administrador
      const resUser = await axios.post(`${API_URL}/users`, payloadUsuario);
      console.log(`  🔑 Usuário Vinculado: ${resUser.data.email} | Senha: ${PADRAO_SENHA}`);

    } catch (error: any) {
      console.error(`  ❌ Erro no processo da secretaria [${sec.name}]:`, error.response?.data?.message || error.message);
    }
  }

  console.log("\n🏁 [SAGE] População finalizada com total sucesso!");
}

rodarPopulacao();