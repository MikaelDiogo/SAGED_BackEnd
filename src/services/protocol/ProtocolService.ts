/**
 * Geração do protocolo inteligente SAGED: YYYY-DEP-TEC-ID (ID com 5 dígitos).
 * Contador reinicia por combinação (ano, código do departamento, tipo de técnico).
 */
export class ProtocolService {
  static normalizeSegment(code: string): string {
    const trimmed = code.trim();
    if (/^\d+$/.test(trimmed)) {
      return trimmed.padStart(2, "0");
    }
    return trimmed;
  }

  protocolPrefix(year: number, deptCode: string, techTypeCode: string): string {
    const dep = ProtocolService.normalizeSegment(deptCode);
    const tec = ProtocolService.normalizeSegment(techTypeCode);
    return `${year}-${dep}-${tec}-`;
  }

  nextSequence(existingCount: number): string {
    return String(existingCount + 1).padStart(5, "0");
  }

  buildProtocol(year: number, deptCode: string, techTypeCode: string, sequence: string): string {
    return `${this.protocolPrefix(year, deptCode, techTypeCode)}${sequence}`;
  }
}
