export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: string;
  isSectorLeader?: boolean;
  tech_type_code?: string; // Linha adicionada para corrigir o erro de compilação
};