import { type NextRequest, NextResponse } from "next/server"

// Demo endpoint to manually trigger activities for testing
export async function POST(request: NextRequest) {
  try {
    const demoActivities = [
      { type: "success", message: "Biodigestor atingiu temperatura ideal de operação" },
      { type: "info", message: "Processamento de 500kg de resíduos orgânicos iniciado" },
      { type: "warning", message: "Nível de metano acima do esperado - verificar ventilação" },
      { type: "success", message: "Geração de energia elétrica aumentou 8% na última hora" },
      { type: "info", message: "Sistema de monitoramento atualizado para versão 2.1" },
      { type: "warning", message: "Sensor de umidade reportando valores inconsistentes" },
      { type: "success", message: "Manutenção preventiva concluída com sucesso" },
      { type: "error", message: "Falha temporária na comunicação com sensor de pressão" },
      { type: "info", message: "Backup automático dos dados realizado" },
      { type: "success", message: "Eficiência do sistema otimizada - economia de 12%" },
    ]

    const randomActivity = demoActivities[Math.floor(Math.random() * demoActivities.length)]

    // Send to main activities endpoint
    const response = await fetch(`${request.nextUrl.origin}/api/activities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(randomActivity),
    })

    if (response.ok) {
      const result = await response.json()
      return NextResponse.json({
        success: true,
        message: "Demo activity created successfully",
        data: result.data,
      })
    } else {
      throw new Error("Failed to create demo activity")
    }
  } catch (error) {
    console.error("Error creating demo activity:", error)
    return NextResponse.json({ success: false, error: "Failed to create demo activity" }, { status: 500 })
  }
}
