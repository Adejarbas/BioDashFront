"use client"

import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, Droplet, Leaf, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"

interface MetricData {
  value: number
  changePercent: string
  increasing: boolean
}

interface DashboardData {
  energy: MetricData
  waste: MetricData
  tax: MetricData
  efficiency: MetricData
}

type IndicatorRow = {
  energy_generated: number | null
  waste_processed: number | null
  tax_savings: number | null
  measured_at?: string | null
  created_at?: string | null
}

export function DashboardStats() {
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<DashboardData>({
    energy: { value: 0, changePercent: "0%", increasing: true },
    waste: { value: 0, changePercent: "0%", increasing: true },
    tax: { value: 0, changePercent: "0%", increasing: true },
    efficiency: { value: 0, changePercent: "0%", increasing: true },
  })

  useEffect(() => {
    setMounted(true)
    loadDashboardData()

    const interval = setInterval(loadDashboardData, 30_000)
    return () => clearInterval(interval)
  }, [])

  // Função auxiliar para calcular a porcentagem de mudança
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  // Função auxiliar para formatar o objeto de dados
  const formatMetric = (current: number, previous: number): MetricData => {
    const change = calculateChange(current, previous)
    return {
      value: current,
      changePercent: `${Math.abs(change).toFixed(1)}%`,
      increasing: change >= 0,
    }
  }

  const loadDashboardData = async () => {
    try {
      // IDEAL_RATIO: Quanto de energia (kWh) 1 kg de resíduo deve gerar idealmente
      const IDEAL_RATIO = 0.8 

      let query = supabase
        .from("biodigester_indicators")
        .select("energy_generated, waste_processed, tax_savings, measured_at, created_at")
        .order("measured_at", { ascending: false, nullsFirst: false })
        .limit(2) // <--- MUDANÇA IMPORTANTE: Buscamos 2 registros para comparar

      let { data: rows, error } = await query
      
      // Fallback para created_at se der erro ou vier vazio
      if (error || !rows || rows.length === 0) {
        const fallback = await supabase
          .from("biodigester_indicators")
          .select("energy_generated, waste_processed, tax_savings, measured_at, created_at")
          .order("created_at", { ascending: false, nullsFirst: false })
          .limit(2)
        rows = fallback.data
        if (fallback.error) throw fallback.error
      }

      const current = rows?.[0]
      const previous = rows?.[1] // Pode ser undefined se só tiver 1 registro no banco

      // Valores Atuais
      const curEnergy = Number(current?.energy_generated ?? 0)
      const curWaste = Number(current?.waste_processed ?? 0)
      const curTax = Number(current?.tax_savings ?? 0)
      
      // Cálculo de Eficiência Atual
      let curEfficiency = 0
      if (curWaste > 0) {
        curEfficiency = Math.min(((curEnergy / curWaste) / IDEAL_RATIO) * 100, 100)
      }

      // Valores Anteriores (se não existir registro anterior, assume 0)
      const prevEnergy = Number(previous?.energy_generated ?? 0)
      const prevWaste = Number(previous?.waste_processed ?? 0)
      const prevTax = Number(previous?.tax_savings ?? 0)

      // Cálculo de Eficiência Anterior
      let prevEfficiency = 0
      if (prevWaste > 0) {
        prevEfficiency = Math.min(((prevEnergy / prevWaste) / IDEAL_RATIO) * 100, 100)
      }

      // Atualiza o estado com cálculos de variação
      setData({
        energy: formatMetric(curEnergy, prevEnergy),
        waste: formatMetric(curWaste, prevWaste),
        tax: formatMetric(curTax, prevTax),
        efficiency: formatMetric(curEfficiency, prevEfficiency),
      })

    } catch (err) {
      console.error("Error loading dashboard data:", err)
    }
  }

  if (!mounted) return null

  return (
    <>
      {/* CARD 1: Resíduos */}
      <Card className="bio-stat-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-800">Resíduos Processados</CardTitle>
          <div className="rounded-full bg-green-100 p-2">
            <Droplet className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">
            {data.waste.value.toFixed(1)}
            <span className="text-xs font-normal text-green-500 ml-1">kg</span>
          </div>
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {data.waste.increasing ? (
              <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={data.waste.increasing ? "text-green-500" : "text-red-500"}>
              {data.waste.changePercent}
            </span>
            <span className="ml-1">em relação ao registro anterior</span>
          </p>
        </CardContent>
      </Card>

      {/* CARD 2: Energia */}
      <Card className="bio-stat-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-800">Energia Gerada</CardTitle>
          <div className="rounded-full bg-yellow-100 p-2">
            <Zap className="h-4 w-4 text-yellow-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">
            {data.energy.value.toFixed(1)}
            <span className="text-xs font-normal text-green-500 ml-1">kWh</span>
          </div>
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {data.energy.increasing ? (
              <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={data.energy.increasing ? "text-green-500" : "text-red-500"}>
              {data.energy.changePercent}
            </span>
            <span className="ml-1">em relação ao registro anterior</span>
          </p>
        </CardContent>
      </Card>

      {/* CARD 3: Impostos */}
      <Card className="bio-stat-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-800">Imposto Abatido</CardTitle>
          <div className="rounded-full bg-blue-100 p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-blue-600"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M16 8h-6.5a2.5 2.5 0 0 0 0 5h3a2.5 2.5 0 0 1 0 5H6"></path>
              <path d="M12 18v2"></path>
              <path d="M12 4v2"></path>
            </svg>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">
            R$ {data.tax.value.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {data.tax.increasing ? (
              <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={data.tax.increasing ? "text-green-500" : "text-red-500"}>
              {data.tax.changePercent}
            </span>
            <span className="ml-1">em relação ao registro anterior</span>
          </p>
        </CardContent>
      </Card>

      {/* CARD 4: Eficiência */}
      <Card className="bio-stat-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-800">Eficiência do Sistema</CardTitle>
          <div className="rounded-full bg-green-100 p-2">
            <Leaf className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">
            {data.efficiency.value.toFixed(1)}
            <span className="text-xs font-normal text-green-500 ml-1">%</span>
          </div>
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {data.efficiency.increasing ? (
              <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={data.efficiency.increasing ? "text-green-500" : "text-red-500"}>
              {data.efficiency.changePercent}
            </span>
            <span className="ml-1">em relação ao registro anterior</span>
          </p>
        </CardContent>
      </Card>
    </>
  )
}