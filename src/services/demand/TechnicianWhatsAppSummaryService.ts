import { AppDataSource } from "../../database/data-source.js";
import { User } from "../../entities/User.js";
import type { IDemandRepository } from "../../repositories/IDemandRepository.js";
import { DemandStatus } from "../../constants/demand-status.js";

/**
 * Resposta em texto para integração WhatsApp (quadro pessoal do técnico).
 */
export class TechnicianWhatsAppSummaryService {
  private readonly userRepository = AppDataSource.getRepository(User);

  constructor(private readonly demandRepository: IDemandRepository) {}

  async executeByLid(lid: string): Promise<string> {
    const technician = await this.userRepository.findOne({ where: { lid } });
    if (!technician) return "⚠️ Usuário não identificado no sistema SAGED.";

    const demands = await this.demandRepository.findAllFiltered(
      {
        technicianId: technician.id,
        status: DemandStatus.EM_ANDAMENTO,
      },
      1,
      20
    );

    if (demands.length === 0) {
      return `✅ Olá ${technician.name}, sem pendências no momento!`;
    }

    let response = `👨‍🔧 *LISTA DE TAREFAS - ${technician.name}*\n\n`;
    demands.forEach((d, index) => {
      response += `*${index + 1}. PROTOCOLO:* ${d.protocol}\n📍 *LOCAL:* ${d.department?.name}\n📝 *DESC:* ${d.title}\n----------\n`;
    });
    return response;
  }
}
