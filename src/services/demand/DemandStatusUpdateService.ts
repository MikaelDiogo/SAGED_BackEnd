import type { IDemandRepository } from "../../repositories/IDemandRepository.js";
import { NotificationService } from "../NotificationService.js";
import { requiresLongJustification } from "../../constants/demand-status.js";

export type UpdateDemandStatusInput = {
  demandId: string;
  status: string;
  technicianId: string;
  description?: string | undefined;
  asset_tag?: string | undefined;
};

/**
 * Transições de status + auditoria (histórico) + notificação ao solicitante.
 */
export class DemandStatusUpdateService {
  constructor(
    private readonly demandRepository: IDemandRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(data: UpdateDemandStatusInput): Promise<{ message: string }> {
    const demand = await this.demandRepository.findById(data.demandId);
    if (!demand) throw new Error("Demanda não encontrada.");

    const previousStatus: string = demand.status;
    const description = (data.description ?? "").trim();

    if (requiresLongJustification(data.status)) {
      if (description.length < 15) {
        throw new Error("Justificativa descritiva deve ter pelo menos 15 caracteres para interrupção/cancelamento.");
      }
    } else if (description.length > 0 && description.length < 3) {
      throw new Error("Observação inválida (mínimo 3 caracteres quando informada).");
    }

    const historyDescription = description.length > 0 ? description : "Atualização de status sem observações adicionais.";

    await this.demandRepository.updateStatus(
      data.demandId,
      data.status,
      data.technicianId,
      data.asset_tag,
    );

    await this.demandRepository.addHistory({
      demandId: data.demandId,
      technicianId: data.technicianId,
      previousStatus,
      status: data.status,
      description: historyDescription,
    });

    if (demand.sender?.lid) {
      await this.notificationService.notifyStatusUpdate(
        demand.sender.lid,
        demand.protocol,
        data.status,
      );
    }

    return { message: "Status atualizado com log registrado." };
  }
}
