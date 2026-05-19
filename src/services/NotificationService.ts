export class NotificationService {
  
  /**
   * Simula o envio de uma notificação de nova demanda
   */
  async notifyNewDemand(technicianLid: string, protocol: string, title: string) {
    const message = `🔔 *Novo Chamado SAGED*\n\n` +
                    `Olá! Um novo chamado foi atribuído a você.\n\n` +
                    `*Protocolo:* ${protocol}\n` +
                    `*Assunto:* ${title}\n\n` +
                    `Acesse o painel para visualizar os detalhes.`;

    // Por enquanto, apenas logamos no terminal
    console.log(`\n--- ENVIANDO WHATSAPP (SIMULADO) ---`);
    console.log(`Para: ${technicianLid}`);
    console.log(`Mensagem: ${message}`);
    console.log(`-----------------------------------\n`);
  }

  /**
   * Simula o envio de uma atualização de status para o autor da demanda
   */
  async notifyStatusUpdate(senderLid: string, protocol: string, newStatus: string) {
    const message = `📋 *Atualização de Status - SAGED*\n\n` +
                    `O seu chamado *${protocol}* mudou de status.\n\n` +
                    `*Novo Status:* ${newStatus}\n\n` +
                    `O técnico responsável registrou uma nova movimentação.`;

    console.log(`\n--- ENVIANDO WHATSAPP (SIMULADO) ---`);
    console.log(`Para: ${senderLid}`);
    console.log(`Mensagem: ${message}`);
    console.log(`-----------------------------------\n`);
  }
}