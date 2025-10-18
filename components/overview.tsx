"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase/client"

type IndicatorRow = {
  energy_generated: number | null
  waste_processed: number | null
  tax_savings: number | null
  measured_at?: string | null
  created_at?: string | null
  // user_id?: string | null // descomente se quiser filtrar por usuário
}

type ChartPoint = {
  name: string        // "Jan", "Fev", ...
  wasteProcessed: number
  energyGenerated: number
  taxDeduction: number
}

export function Overview() {
  const [mounted, setMounted] = useState(false)
  const [rows, setRows] = useState<IndicatorRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    loadData()
    const id = setInterval(loadData, 30_000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  const loadData = async () => {
    try {
      setLoading(true)

      // (opcional) filtrar por usuário/empresa:
      // const { data: auth } = await supabase.auth.getUser()
      // const uid = auth.user?.id

      const since = new Date()
      since.setMonth(since.getMonth() - 12)

      let q = supabase
        .from("biodigester_indicators")
        .select("energy_generated, waste_processed, tax_savings, measured_at, created_at")
        .gte("measured_at", since.toISOString())
        .order("measured_at", { ascending: true })

      // if (uid) q = q.eq("user_id", uid)

      let { data, error } = await q

      // fallback se measured_at não existir / sem permissão
      if (error) {
        const fb = await supabase
          .from("biodigester_indicators")
          .select("energy_generated, waste_processed, tax_savings, measured_at, created_at")
          .gte("created_at", since.toISOString())
          .order("created_at", { ascending: true })
        if (fb.error) throw fb.error
        data = fb.data
      }

      setRows(data ?? [])
    } finally {
      setLoading(false)
    }
  }

  // === Conversão para o MESMO shape que seus gráficos usam ===
  const data: ChartPoint[] = useMemo(() => {
    if (!rows.length) return []

    // helper p/ rótulo curto PT-BR: "Jan", "Fev", "Mar", ...
    const monthShort = (d: Date) =>
      new Intl.DateTimeFormat("pt-BR", { month: "short" })
        .format(d)
        .replace(".", "")
        .replace(/^\w/, (c) => c.toUpperCase())

    // agrega por mês (YYYY-MM)
    const byMonth = new Map<string, { date: Date; w: number; e: number; t: number }>()
    for (const r of rows) {
      const whenStr = r.measured_at ?? r.created_at
      if (!whenStr) continue
      const d = new Date(whenStr)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const acc = byMonth.get(key) ?? { date: new Date(d.getFullYear(), d.getMonth(), 1), w: 0, e: 0, t: 0 }
      acc.w += Number(r.waste_processed ?? 0)
      acc.e += Number(r.energy_generated ?? 0)
      acc.t += Number(r.tax_savings ?? 0)
      byMonth.set(key, acc)
    }

    return Array.from(byMonth.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-12)
      .map((m) => ({
        name: monthShort(m.date),                       // ex.: "Jan"
        wasteProcessed: Number(m.w.toFixed(2)),
        energyGenerated: Number(m.e.toFixed(2)),
        taxDeduction: Number(m.t.toFixed(2)),
      }))
  }, [rows])

  if (!mounted) return null

  // evita quebrar layout quando ainda não há dados
  const chartData = data.length
    ? data
    : [{ name: "", wasteProcessed: 0, energyGenerated: 0, taxDeduction: 0 }]

  return (
    <Tabs defaultValue="all" className="w-full">
      <div className="flex items-center">
        <TabsList className="ml-auto">
          <TabsTrigger value="all">Todas Métricas</TabsTrigger>
          <TabsTrigger value="waste">Resíduos</TabsTrigger>
          <TabsTrigger value="energy">Energia</TabsTrigger>
          <TabsTrigger value="tax">Impostos</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="all" className="space-y-4 mt-4">
        <div className="h-[300px] bg-white p-4 rounded-lg border border-green-100">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="wasteProcessed"
                name="Resíduos (kg)"
                stroke="#10b981"
                strokeWidth={2}
                activeDot={{ r: 8, fill: "#10b981" }}
              />
              <Line
                type="monotone"
                dataKey="energyGenerated"
                name="Energia (kWh)"
                stroke="#f59e0b"
                strokeWidth={2}
                activeDot={{ r: 8, fill: "#f59e0b" }}
              />
              <Line
                type="monotone"
                dataKey="taxDeduction"
                name="Impostos (R$)"
                stroke="#3b82f6"
                strokeWidth={2}
                activeDot={{ r: 8, fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
          {loading && <div className="text-xs text-muted-foreground mt-2">Atualizando…</div>}
        </div>
      </TabsContent>

      <TabsContent value="waste" className="space-y-4 mt-4">
        <div className="h-[300px] bg-white p-4 rounded-lg border border-green-100">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="wasteProcessed" name="Resíduos Processados (kg)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {loading && <div className="text-xs text-muted-foreground mt-2">Atualizando…</div>}
        </div>
      </TabsContent>

      <TabsContent value="energy" className="space-y-4 mt-4">
        <div className="h-[300px] bg-white p-4 rounded-lg border border-green-100">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="energyGenerated" name="Energia Gerada (kWh)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {loading && <div className="text-xs text-muted-foreground mt-2">Atualizando…</div>}
        </div>
      </TabsContent>

      <TabsContent value="tax" className="space-y-4 mt-4">
        <div className="h-[300px] bg-white p-4 rounded-lg border border-green-100">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="taxDeduction" name="Imposto Abatido (R$)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {loading && <div className="text-xs text-muted-foreground mt-2">Atualizando…</div>}
        </div>
      </TabsContent>
    </Tabs>
  )
}
