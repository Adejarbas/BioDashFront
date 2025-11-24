"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FileSpreadsheet, FileCode } from "lucide-react";

export function ExportReports() {
  const [loading, setLoading] = useState<string | null>(null);

  const gatherMetrics = () => {
    // Em versão futura, pode buscar diretamente dos componentes via contexto ou API.
    return [
      ["Métrica", "Valor", "Unidade", "Variação"],
      ["Resíduos Processados", "1042.4", "kg", "+12.5%"],
      ["Energia Gerada", "1785.3", "kWh", "+8.2%"],
      ["Imposto Abatido", "1185.20", "R$", "+15.3%"],
      ["Eficiência do Sistema", "94.2", "%", "+1.2%"],
    ];
  };

  const captureChart = async (): Promise<HTMLCanvasElement | null> => {
    try {
      const el = document.getElementById("overview-chart-all")
        || document.getElementById("overview-chart-waste");
      if (!el) return null;
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, { backgroundColor: "#ffffff", scale: 2 });
      return canvas;
    } catch (e) {
      console.error("Falha ao capturar gráfico", e);
      return null;
    }
  };

  const generatePDF = async () => {
    setLoading("pdf");
    try {
      const jsPDFMod = await import("jspdf");
      const jsPDF = jsPDFMod.jsPDF;
      const metrics = gatherMetrics();
      const pdf = new jsPDF({ orientation: "landscape" });

      pdf.setFontSize(16);
      pdf.text("Relatório do Biodigestor", 14, 15);
      pdf.setFontSize(10);
      pdf.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 22);

      // Tabela simples
      let startY = 30;
      const colWidths = [70, 35, 30, 35];
      pdf.setFontSize(11);
      metrics.forEach((row, rIdx) => {
        let x = 14;
        row.forEach((cell, cIdx) => {
          pdf.text(String(cell), x, startY + rIdx * 6);
          x += colWidths[cIdx];
        });
      });

      // Captura do gráfico
      const canvas = await captureChart();
      if (canvas) {
        const imgData = canvas.toDataURL("image/png");
        // Ajustar tamanho para caber na página
        const imgWidth = 250;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 14, startY + metrics.length * 6 + 10, imgWidth, imgHeight);
      } else {
        pdf.text("[Gráfico não disponível]", 14, startY + metrics.length * 6 + 10);
      }

      pdf.save(`relatorio_biodigestor_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar PDF");
    } finally {
      setLoading(null);
    }
  };

  const generateExcel = async () => {
    setLoading("excel");
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = "BioDash";
      wb.created = new Date();
      const ws = wb.addWorksheet("Relatório");

      const metrics = gatherMetrics();
      ws.addRow(["Relatório do Biodigestor"]);
      ws.mergeCells("A1:D1");
      ws.getCell("A1").font = { bold: true, size: 14 };
      ws.addRow([`Gerado em: ${new Date().toLocaleString("pt-BR")}`]);
      ws.mergeCells("A2:D2");
      ws.getCell("A2").font = { italic: true, size: 10 };
      ws.addRow([]);

      metrics.forEach((row) => ws.addRow(row));
      ws.columns.forEach(col => { col.width = 24; });
      ws.getRow(4).font = { bold: true };

      // Captura do gráfico para imagem
      const canvas = await captureChart();
      if (canvas) {
        const dataUrl = canvas.toDataURL("image/png");
        const imageId = wb.addImage({ base64: dataUrl.split(",")[1], extension: "png" });
        // Posiciona imagem abaixo da tabela
        ws.addImage(imageId, {
          tl: { col: 0, row: metrics.length + 6 },
          ext: { width: 800, height: 300 },
        });
      }

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio_biodigestor_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar Excel");
    } finally {
      setLoading(null);
    }
  };

  const generateCSV = async () => {
    setLoading("csv");
    try {
      const data = gatherMetrics();

      // Criar CSV
      const csvContent = data.map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `relatorio_biodigestor_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("Erro ao gerar CSV");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-green-800">Exportar Dados</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Gere relatórios completos com gráficos e métricas do biodigestor nos formatos disponíveis.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-600" />
              Relatório PDF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Documento completo com gráficos, tabelas e análises
            </p>
            <button 
              onClick={generatePDF}
              disabled={loading !== null}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {loading === "pdf" ? "Gerando..." : "Gerar PDF"}
            </button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              Planilha Excel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Dados em planilha com gráficos interativos
            </p>
            <button 
              onClick={generateExcel}
              disabled={loading !== null}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {loading === "excel" ? "Gerando..." : "Gerar Excel"}
            </button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCode className="h-5 w-5 text-blue-600" />
              Arquivo CSV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Dados brutos para importação e análise
            </p>
            <button 
              onClick={generateCSV}
              disabled={loading !== null}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {loading === "csv" ? "Gerando..." : "Gerar CSV"}
            </button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <h4 className="font-semibold text-green-800 mb-2">Conteúdo dos Relatórios</h4>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• Gráfico de desempenho (Resíduos, Energia, Impostos)</li>
          <li>• Métricas principais do período</li>
          <li>• Comparativo mensal e tendências</li>
          <li>• Status de manutenções agendadas</li>
          <li>• Localização dos biodigestores</li>
        </ul>
      </div>
    </div>
  );
}
