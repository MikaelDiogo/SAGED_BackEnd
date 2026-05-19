/**
 * RBAC roles for SAGED (alinhado às regras de negócio).
 * `tech_type_code` na entidade User continua sendo o código TEC da especialidade (Redes, Hardware, etc.).
 */
export const UserRole = {
  ADMIN_GERAL: "ADMIN_GERAL",
  ADMIN_SETOR: "ADMIN_SETOR",
  TECNICO_LIDER: "TECNICO_LIDER",
  TECNICO: "TECNICO",
} as const;

export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];
