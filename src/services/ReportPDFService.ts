import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable"; 
import type { ManagementReportResult } from "./demand/ManagementReportService.js";

// Correção para TypeScript/Node: Se o import padrão vier como um objeto com a propriedade 'default'
const applyAutoTable = (autoTable as any).default || autoTable;

type PdfAuthor = { name: string; role: string; unit: string };

export class ReportPDFService {
  async generateMonthlyReport(reportData: ManagementReportResult, userData: PdfAuthor) {
    // Instancia o documento normalmente
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString("pt-BR");
    const metrics = reportData.metrics;

    // Cabeçalho e Títulos
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 51);
    doc.text("Relatório Operacional - Sistema SAGE", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Unidade: ${userData.unit}`, 14, 28);
    doc.text(`Emissor: ${userData.name} (${userData.role})`, 14, 33);
    doc.text(`Período: ${reportData.period}`, 14, 38);
    doc.text(`Data de Emissão: ${dateStr}`, 14, 43);

    doc.setLineWidth(0.5);
    doc.line(14, 47, 196, 47);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("RESUMO DO PERÍODO", 14, 57);

    const summaryData = [
      ["Total de Demandas", String(metrics.total)],
      ["Taxa de Resolução (%)", String(metrics.resolutionRate)],
      ["Tempo Médio (TMA)", String(metrics.avgTime)],
      ["Interrompidas / Canceladas", String(metrics.interrupted)],
    ];

    // Utiliza a referência resolvida para renderizar a primeira tabela
    applyAutoTable(doc, {
      startY: 61,
      head: [["Indicador", "Valor"]],
      body: summaryData,
      theme: "striped",
      headStyles: { fillColor: 200, textColor: 0 },
    });

    // Recupera a posição final da última tabela de forma segura
    const lastY = (doc as any).lastAutoTable.finalY;

    doc.text("EFICIÊNCIA DA EQUIPE TÉCNICA", 14, lastY + 15);

    const teamData = reportData.technicians.map((t) => [
      t.name,
      String(t.count),
      String(t.concluded),
    ]);

    // Segunda tabela usando a mesma referência funcional
    applyAutoTable(doc, {
      startY: lastY + 20,
      head: [["Técnico", "Chamados", "Concluídos"]],
      body: teamData,
      headStyles: { fillColor: [0, 102, 51] },
    });

    return Buffer.from(doc.output("arraybuffer"));
  }
}