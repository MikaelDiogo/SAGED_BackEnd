export const DemandStatus = {
  A_FAZER: "A_FAZER",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  CONCLUIDO: "CONCLUIDO",
  INTERROMPIDO: "INTERROMPIDO",
  /** Legado / compatível com dados antigos */
  CANCELADO: "CANCELADO",
} as const;

const INTERRUPTION_LIKE = new Set<string>([
  DemandStatus.INTERROMPIDO,
  DemandStatus.CANCELADO,
]);

export function requiresLongJustification(status: string): boolean {
  return INTERRUPTION_LIKE.has(status);
}
