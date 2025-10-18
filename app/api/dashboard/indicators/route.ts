import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

export async function GET() {
  try {
    const { data: indicators, error } = await supabase
      .from("biodigester_indicators")
      .select("name, current_value, unit, status")
      .in("name", ["Energia Gerada", "Resíduos Processados", "Imposto Abatido"])
      .order("created_at", { ascending: true })

    if (error) throw error

    // Format data for dashboard consumption
    const dashboardData = {
      energyGenerated: indicators?.find((i) => i.name === "Energia Gerada")?.current_value || 0,
      wasteProcessed: indicators?.find((i) => i.name === "Resíduos Processados")?.current_value || 0,
      taxSavings: indicators?.find((i) => i.name === "Imposto Abatido")?.current_value || 0,
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("Error fetching dashboard indicators:", error)
    return NextResponse.json({ error: "Failed to fetch indicators" }, { status: 500 })
  }
}
