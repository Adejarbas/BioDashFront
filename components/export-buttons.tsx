"use client"

import { Button } from "@/components/ui/button"
import { Download, FileText, FileSpreadsheet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useCallback } from "react"

interface ExportButtonsProps {
  data?: Array<{ date: string; activity: string; status: string; value?: string }>
  filename?: string
}

type IndicatorRow = {
  energy_generated: number | null
  waste_processed: number | null
  tax_savings: number | null
  efficiency: number | null
  measured_at?: string | null
  created_at?: string | null
}

const fmtNum = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 })
const fmtInt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 })
const fmtBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
const fmtDate = (d: Date) => d.toLocaleDateString("pt-BR")

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function startOfNextMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 1) }

export function ExportButtons({ data = [], filename = "biodigester-report" }: ExportButtonsProps) {
  const { toast } = useToast()

  /** Lê do Supabase e monta os dados do relatório (mês atual + últimos 7 dias como atividades) */
  const buildReportData = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser()
    const userId = auth?.user?.id

    const now = new Date()
    const today = startOfDay(now)
    const monthFrom = startOfMonth(today)
    const monthTo = startOfNextMonth(today)
    const weekFrom = startOfDay(addDays(today, -6))
    const weekTo = addDays(today, 1)

    const selectCols =
      "energy_generated, waste_processed, tax_savings, efficiency, measured_at, created_at"

    // MÊS
    let qMonth = supabase
      .from("biodigester_indicators")
      .select(selectCols)
      .gte("measured_at", monthFrom.toISOString())
      .lt("measured_at", monthTo.toISOString())
      .order("measured_at", { ascending: true })
    if (userId) qMonth = qMonth.eq("user_id", userId)

    let { data: monthRows, error: mErr } = await qMonth
    if (mErr) {
      let fb = supabase
        .from("biodigester_indicators")
        .select(selectCols)
        .gte("created_at", monthFrom.toISOString())
        .lt("created_at", monthTo.toISOString())
        .order("created_at", { ascending: true })
      if (userId) fb = fb.eq("user_id", userId)
      const res = await fb
      if (res.error) throw res.error
      monthRows = res.data as IndicatorRow[]
    }

    // SEMANA (atividades)
    let qWeek = supabase
      .from("biodigester_indicators")
      .select(selectCols)
      .gte("measured_at", weekFrom.toISOString())
      .lt("measured_at", weekTo.toISOString())
      .order("measured_at", { ascending: false })
    if (userId) qWeek = qWeek.eq("user_id", userId)

    let { data: weekRows, error: wErr } = await qWeek
    if (wErr) {
      let fb = supabase
        .from("biodigester_indicators")
        .select(selectCols)
        .gte("created_at", weekFrom.toISOString())
        .lt("created_at", weekTo.toISOString())
        .order("created_at", { ascending: false })
      if (userId) fb = fb.eq("user_id", userId)
      const res = await fb
      if (res.error) throw res.error
      weekRows = res.data as IndicatorRow[]
    }

    // Agregações do mês
    const monthAgg = (monthRows ?? []).reduce(
      (acc, r) => {
        acc.energy += Number(r.energy_generated ?? 0)
        acc.waste += Number(r.waste_processed ?? 0)
        acc.tax += Number(r.tax_savings ?? 0)
        if (r.efficiency !== null && r.efficiency !== undefined) {
          acc.effSum += Number(r.efficiency)
          acc.effCount++
        }
        return acc
      },
      { energy: 0, waste: 0, tax: 0, effSum: 0, effCount: 0 }
    )
    const monthEff = monthAgg.effCount ? monthAgg.effSum / monthAgg.effCount : null

    const activities =
      data.length > 0
        ? data
        : (weekRows ?? []).slice(0, 10).map((r) => {
            const when = r.measured_at ?? r.created_at
            return {
              date: when ? fmtDate(new Date(when)) : "",
              activity: `Energia: ${fmtInt.format(Number(r.energy_generated ?? 0))} kWh • Resíduos: ${fmtInt.format(
                Number(r.waste_processed ?? 0)
              )} kg`,
              status: "Registrado",
              value: r.tax_savings != null ? fmtBRL.format(Number(r.tax_savings)) : "",
            }
          })

    const report = {
      title: "Relatório do Biodigestor",
      date: fmtDate(now),
      periodMonth: `${fmtDate(monthFrom)} — ${fmtDate(addDays(monthTo, -1))}`,
      stats: {
        wasteProcessed: `${fmtInt.format(Math.round(monthAgg.waste))} kg`,
        energyGenerated: `${fmtInt.format(Math.round(monthAgg.energy))} kWh`,
        efficiency: monthEff === null ? "—" : `${fmtNum.format(monthEff)}%`,
        taxSavings: fmtBRL.format(monthAgg.tax),
      },
      activities,
    }

    return report
  }, [data])

  /** PDF robusto (com fallback se libs não estiverem instaladas) */
const exportToPDF = async () => {
  if (typeof window === "undefined") return
  try {
    const report = await buildReportData()

    // Tente importar e valide os formatos mais comuns
    const jspdfMod = await import("jspdf")
    const autoTableMod = await import("jspdf-autotable")

    // jsPDF quase sempre vem como named export
    const jsPDFCtor = (jspdfMod as any).jsPDF || (jspdfMod as any).default?.jsPDF || (jspdfMod as any).default
    if (!jsPDFCtor) {
      throw new Error("jsPDF não encontrado no módulo 'jspdf'. Verifique a instalação/versão.")
    }

    // autotable v3 exporta default (função)
    const autoTable =
      (autoTableMod as any).default ||
      (autoTableMod as any).autoTable ||
      (autoTableMod as any)

    if (typeof autoTable !== "function") {
      throw new Error("autoTable não encontrado no módulo 'jspdf-autotable'. Verifique a instalação/versão.")
    }

    const doc = new jsPDFCtor({ unit: "pt" })

    // Cabeçalho
    doc.setFontSize(18)
    doc.text(report.title, 40, 40)
    doc.setFontSize(11)
    doc.text(`Data do Relatório: ${report.date}`, 40, 60)
    doc.text(`Período (mês): ${report.periodMonth}`, 40, 76)

    // Estatísticas
    doc.setFontSize(13)
    doc.text("Estatísticas (Mês Corrente)", 40, 110)
    autoTable(doc, {
      startY: 120,
      theme: "grid",
      styles: { fontSize: 11, cellPadding: 6 },
      head: [["Métrica", "Valor"]],
      body: [
        ["Resíduos Processados", report.stats.wasteProcessed],
        ["Energia Gerada", report.stats.energyGenerated],
        ["Eficiência Média", report.stats.efficiency],
        ["Economia Fiscal", report.stats.taxSavings],
      ],
    })

    // Atividades
    const finalY = (doc as any).lastAutoTable?.finalY || 160
    doc.setFontSize(13)
    doc.text("Atividades Recentes", 40, finalY + 20)
    autoTable(doc, {
      startY: finalY + 30,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 6 },
      head: [["Data", "Atividade", "Status", "Valor"]],
      body: report.activities.map((a) => [a.date, a.activity, a.status, a.value ?? ""]),
    })

    doc.save(`${filename}.pdf`)
    toast({ title: "PDF exportado", description: "Relatório gerado com sucesso." })
  } catch (error: any) {
    console.error("[exportToPDF] erro:", error?.message || error)
    // Se quiser manter fallback TXT, descomente o bloco abaixo; senão, apenas mostre o toast de erro.
    // await fallbackTxt(report, filename)

    toast({
      title: "Erro na exportação",
      description:
        error?.message?.includes("Cannot find module") || error?.message?.includes("não encontrado")
          ? "Bibliotecas 'jspdf' e/ou 'jspdf-autotable' não encontradas. Instale-as no projeto."
          : (error?.message || "Não foi possível exportar o PDF."),
      variant: "destructive",
    })
  }
}


  /** CSV (mesma fonte de dados do PDF) */
  const exportToCSV = async () => {
    try {
      const report = await buildReportData()
      const rows: string[][] = [
        ["Relatório do Biodigestor"],
        ["Data do Relatório", report.date],
        ["Período (mês)", report.periodMonth],
        [""],
        ["ESTATÍSTICAS"],
        ["Métrica", "Valor"],
        ["Resíduos Processados", report.stats.wasteProcessed],
        ["Energia Gerada", report.stats.energyGenerated],
        ["Eficiência Média", report.stats.efficiency],
        ["Economia Fiscal", report.stats.taxSavings],
        [""],
        ["ATIVIDADES RECENTES"],
        ["Data", "Atividade", "Status", "Valor"],
        ...report.activities.map((a) => [a.date, a.activity, a.status, a.value ?? ""]),
      ]

      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${filename}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({ title: "CSV exportado", description: "Dados exportados com sucesso." })
    } catch (error: any) {
      console.error("[exportToCSV] erro:", error)
      toast({
        title: "Erro na exportação",
        description: error?.message || "Não foi possível exportar o CSV.",
        variant: "destructive",
      })
    }
  }

  /** Excel (usa xlsx; se não instalado, cai para CSV) */
const exportToExcel = async () => {
  if (typeof window === "undefined") return
  try {
    const report = await buildReportData()

    // === Import dinâmico robusto ===
    let XLSX: any
    try {
      // Prioriza a build ESM (melhor p/ Next moderno)
      const mod = await import("xlsx/xlsx.mjs")
      XLSX = mod?.default ?? mod
    } catch {
      try {
        // Tenta o pacote padrão (CJS)
        const mod = await import("xlsx")
        XLSX = mod?.default ?? mod
      } catch {
        // Último fallback: bundle completo minificado
        const mod = await import("xlsx/dist/xlsx.full.min.js")
        XLSX = mod?.default ?? mod
      }
    }

    if (!XLSX?.utils) {
      throw new Error("Falha ao carregar a API do SheetJS (XLSX.utils inexistente).")
    }

    // ==== Helpers ====
    const refFromAoA = (aoa: any[][]) =>
      XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: aoa.length - 1, c: Math.max(...aoa.map((r: any[]) => r.length)) - 1 },
      })
    const excelDate = (d: Date) =>
      (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(1899, 11, 30)) /
      (24 * 3600 * 1000)

    // ==== ABA "Resumo" ====
    const resumoAOA: any[][] = [
      ["Relatório do Biodigestor", "", "", ""],
      ["Data do Relatório", report.date, "", ""],
      ["Período (mês)", report.periodMonth, "", ""],
      [""],
      ["ESTATÍSTICAS", "", "", ""],
      ["Métrica", "Valor", "Unidade", "Observações"],
      ["Resíduos Processados", parseInt(report.stats.wasteProcessed), "kg", ""],
      ["Energia Gerada", parseInt(report.stats.energyGenerated), "kWh", ""],
      [
        "Eficiência Média",
        parseFloat(String(report.stats.efficiency).replace("%", "")),
        "%",
        "",
      ],
      [
        "Economia Fiscal",
        parseFloat(
          String(report.stats.taxSavings).replace(/[R$\s\.]/g, "").replace(",", ".")
        ),
        "BRL",
        "",
      ],
    ]

    const wb = XLSX.utils.book_new()
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoAOA)

    // Merge do título
    wsResumo["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]
    // Larguras
    wsResumo["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 10 }, { wch: 30 }]
    // Filtro
    wsResumo["!autofilter"] = { ref: `A6:D${resumoAOA.length}` }
    // Formatos
    const setFormat = (addr: string, z: string) => {
      const cell = wsResumo[addr]
      if (cell) cell.z = z
    }
    setFormat("B7", "0")
    setFormat("B8", "0")
    setFormat("B9", "0.00%")
    setFormat("B10", "R$ #,##0.00")
    if (wsResumo["B9"] && typeof wsResumo["B9"].v === "number") {
      wsResumo["B9"].v = wsResumo["B9"].v / 100
      wsResumo["B9"].t = "n"
    }
    if (wsResumo["B10"] && typeof wsResumo["B10"].v === "number") {
      wsResumo["B10"].t = "n"
    }
    wsResumo["!ref"] = refFromAoA(resumoAOA)
    XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo")

    // ==== ABA "Atividades" ====
    const atividadesAOA: any[][] = [
      ["Data", "Atividade", "Status", "Valor"],
      ...report.activities.map((a: any) => [
        a.date,
        a.activity,
        a.status,
        a.value?.replace(/[R$\s\.]/g, "").replace(",", ".") || "",
      ]),
    ]
    const wsAtv = XLSX.utils.aoa_to_sheet(atividadesAOA)
    wsAtv["!autofilter"] = { ref: `A1:D${atividadesAOA.length}` }

    // Largura “auto-fit” aproximada
    const colW = [0, 0, 0, 0]
    atividadesAOA.forEach((row) =>
      row.forEach((cell: any, i: number) => {
        const len = String(cell ?? "").length
        colW[i] = Math.max(colW[i], len)
      })
    )
    wsAtv["!cols"] = colW.map((wch, i) => ({
      wch: Math.min(Math.max(wch + 2, [10, 30, 14, 12][i] || 12), 60),
    }))

    // Datas coluna A
    for (let r = 2; r <= atividadesAOA.length; r++) {
      const addr = `A${r}`
      const c = wsAtv[addr]
      if (c && typeof c.v === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(c.v)) {
        const [dd, mm, yyyy] = c.v.split("/").map(Number)
        const d = new Date(yyyy, mm - 1, dd)
        c.v = excelDate(d)
        c.t = "n"
        c.z = "dd/mm/yyyy"
      }
    }
    // Valor coluna D como moeda
    for (let r = 2; r <= atividadesAOA.length; r++) {
      const addr = `D${r}`
      const c = wsAtv[addr]
      const num = Number(c?.v)
      if (c && !isNaN(num) && String(c.v).trim() !== "") {
        c.v = num
        c.t = "n"
        c.z = "R$ #,##0.00"
      }
    }

    wsAtv["!ref"] = refFromAoA(atividadesAOA)
    XLSX.utils.book_append_sheet(wb, wsAtv, "Atividades")

    // Escreve arquivo
    XLSX.writeFile(wb, `${filename}.xlsx`)
    toast({ title: "Excel exportado", description: "Arquivo .xlsx gerado com sucesso." })
  } catch (error: any) {
    console.error("[exportToExcel] erro:", error)
    toast({
      title: "Erro na exportação",
      description: error?.message || "Não foi possível exportar o Excel.",
      variant: "destructive",
    })
  }
}


  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={exportToPDF}
        variant="outline"
        size="sm"
        className="border-green-300 text-green-700 hover:bg-green-50 bg-transparent"
      >
        <FileText className="h-4 w-4 mr-2" />
        Exportar PDF
      </Button>
      <Button
        onClick={exportToCSV}
        variant="outline"
        size="sm"
        className="border-green-300 text-green-700 hover:bg-green-50 bg-transparent"
      >
        <Download className="h-4 w-4 mr-2" />
        Exportar CSV
      </Button>
      <Button
        onClick={exportToExcel}
        variant="outline"
        size="sm"
        className="border-green-300 text-green-700 hover:bg-green-50 bg-transparent"
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Exportar Excel
      </Button>
    </div>
  )
}
