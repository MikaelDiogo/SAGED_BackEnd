import { UserRole } from "../constants/user-roles.js";
import type { AuthenticatedUser } from "../types/auth.js";
import { AccessDeniedError } from "../errors/AccessDeniedError.js"; // Caminho corrigido

export type DemandListFilters = {
  technician_id?: string;
  department_id?: string;
  status?: string;
  tech_type_code?: string; 
};

/**
 * Define quais demandas o usuário pode listar no quadro/dashboard (RBAC + escopo setorial).
 */
export function resolveDemandListFilters(user: AuthenticatedUser): DemandListFilters {
  const { role, departmentId, isSectorLeader, tech_type_code } = user;

  if (role === UserRole.ADMIN_GERAL) {
    return {};
  }

  if (!departmentId) {
    throw new Error("Usuário sem vínculo de secretaria (departmentId).");
  }

  const sectorScoped =
    role === UserRole.ADMIN_SETOR ||
    role === UserRole.TECNICO_LIDER ||
    (role === UserRole.TECNICO && isSectorLeader === true);

  if (sectorScoped) {
    return { department_id: departmentId };
  }

  // Se for Técnico Comum, filtra pela secretaria e pela especialidade dele ('01', '02', etc)
  if (role === UserRole.TECNICO) {
    return { 
      department_id: departmentId, 
      tech_type_code: tech_type_code || "SEM_FILA" 
    };
  }

  return { department_id: departmentId };
}

/** Relatório gerencial: restringe o acesso para as roles autorizadas */
export function assertManagementReportAllowed(user: AuthenticatedUser): void {
  const { role, isSectorLeader } = user;

  if (
    role === UserRole.ADMIN_GERAL ||
    role === UserRole.ADMIN_SETOR ||
    role === UserRole.TECNICO_LIDER
  ) {
    return;
  }
  
  if (role === UserRole.TECNICO && isSectorLeader === true) {
    return;
  }
  throw new AccessDeniedError("Acesso negado ao relatório gerencial.");
}

export function resolveReportDepartmentFilter(params: {
  role: string;
  userDepartmentId?: string;
  targetDepartmentId?: string;
  isSectorLeader?: boolean;
}): string | undefined {
  const { role, userDepartmentId, targetDepartmentId, isSectorLeader } = params;

  if (role === UserRole.ADMIN_GERAL) {
    return targetDepartmentId;
  }

  if (
    role === UserRole.ADMIN_SETOR ||
    role === UserRole.TECNICO_LIDER ||
    (role === UserRole.TECNICO && isSectorLeader === true)
  ) {
    return userDepartmentId;
  }

  return userDepartmentId;
}

/**
 * Valida se o usuário tem permissão de acesso (leitura de histórico ou alteração) 
 * para uma demanda específica (Ownership Check).
 */
export function assertDemandAccess(
  user: AuthenticatedUser, 
  demand: { departmentId: string; current_technician_id?: string | null; techTypeCode?: string }
): void {
  const { role, departmentId, id, isSectorLeader, tech_type_code } = user;

  // 1. ADMIN_GERAL: Acesso total irrestrito
  if (role === UserRole.ADMIN_GERAL) return;

  // 2. Lideranças de Setor: Podem acessar qualquer demanda da sua própria secretaria
  const isLeader = 
    role === UserRole.ADMIN_SETOR || 
    role === UserRole.TECNICO_LIDER || 
    (role === UserRole.TECNICO && isSectorLeader === true);

  if (isLeader) {
    if (demand.departmentId === departmentId) return;
    throw new AccessDeniedError("Acesso negado: Esta demanda pertence a outra secretaria.");
  }

  // 3. Técnico Comum: 
  if (role === UserRole.TECNICO) {
    // Se ele já for o técnico atribuído, permite o acesso.
    if (demand.current_technician_id === id) return;

    // Permite acesso se o chamado estiver sem técnico (disponível para ser assumido)
    // e se for da mesma secretaria e especialidade do técnico logado.
    if (!demand.current_technician_id && demand.departmentId === departmentId && demand.techTypeCode === tech_type_code) return;

    throw new AccessDeniedError("Acesso negado: Você não tem permissão para interagir com este chamado.");
  }

  throw new AccessDeniedError("Acesso negado: Você não tem permissão para acessar esta demanda.");
}