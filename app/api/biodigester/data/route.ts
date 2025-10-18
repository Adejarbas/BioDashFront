import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { data: biodigesterData, error } = await supabase
      .from("biodigester_data")
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false })
      .limit(30)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, message: "Failed to fetch data" }, { status: 500 })
    }

    // Process data for charts
    const processedData = {
      wasteProcessed:
        biodigesterData
          ?.slice(0, 7)
          .reverse()
          .map((item, index) => ({
            month: new Date(item.timestamp).toLocaleDateString("pt-BR", { month: "short" }),
            value: item.waste_processed || 0,
          })) || [],
      energyGenerated:
        biodigesterData
          ?.slice(0, 7)
          .reverse()
          .map((item, index) => ({
            month: new Date(item.timestamp).toLocaleDateString("pt-BR", { month: "short" }),
            value: item.energy_generated || 0,
          })) || [],
      stats: {
        wasteProcessed: {
          value: biodigesterData?.[0]?.waste_processed?.toString() || "0",
          unit: "kg",
          change: "+12.5%",
          increasing: true,
        },
        energyGenerated: {
          value: biodigesterData?.[0]?.energy_generated?.toString() || "0",
          unit: "kWh",
          change: "+8.2%",
          increasing: true,
        },
        efficiency: {
          value: biodigesterData?.[0]?.efficiency_rate?.toString() || "0",
          unit: "%",
          change: "+1.2%",
          increasing: true,
        },
      },
    }

    return NextResponse.json({
      success: true,
      data: processedData,
    })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
