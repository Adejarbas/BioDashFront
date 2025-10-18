"use client"

import { useEffect, useState } from "react"
import { Activity, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"

interface ActivityItem {
  id: number
  type: "success" | "warning" | "info" | "error"
  message: string
  timestamp: string
  created_at: string
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/activities?limit=5")
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setActivities(result.data)
        }
      }
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchActivities()

    const interval = setInterval(fetchActivities, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const demoActivities = [
      { type: "success", message: "Sistema de aquecimento otimizado automaticamente" },
      { type: "info", message: "Novo sensor de pH instalado e calibrado" },
      { type: "warning", message: "Pressão do gás ligeiramente elevada" },
      { type: "success", message: "Eficiência energética aumentou para 94%" },
      { type: "info", message: "Backup de dados realizado com sucesso" },
      { type: "warning", message: "Filtro de entrada precisa de limpeza" },
      { type: "success", message: "Meta diária de produção atingida" },
      { type: "info", message: "Relatório semanal gerado automaticamente" },
    ]

    const sendRandomActivity = async () => {
      const randomActivity = demoActivities[Math.floor(Math.random() * demoActivities.length)]

      try {
        const response = await fetch("/api/activities", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(randomActivity),
        })

        if (response.ok) {
          // Refresh activities after adding new one
          fetchActivities()
        }
      } catch (error) {
        console.error("Error sending activity:", error)
      }
    }

    // Start sending demo activities after 5 seconds
    const initialTimeout = setTimeout(() => {
      sendRandomActivity()

      // Continue sending activities at random intervals
      const scheduleNext = () => {
        const randomDelay = Math.random() * 30000 + 15000 // 15-45 seconds
        setTimeout(() => {
          sendRandomActivity()
          scheduleNext()
        }, randomDelay)
      }

      scheduleNext()
    }, 5000)

    return () => clearTimeout(initialTimeout)
  }, [mounted])

  if (!mounted) {
    return null
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start gap-4 rounded-lg border border-green-100 p-3 bg-white">
            <div className="rounded-full bg-green-100 p-1.5 animate-pulse">
              <div className="h-5 w-5 bg-green-200 rounded-full" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-green-100 rounded animate-pulse" />
              <div className="h-3 bg-green-50 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-4 rounded-lg border border-green-100 p-3 bg-white hover:border-green-300 transition-colors"
        >
          <div className="mt-0.5">
            {item.type === "success" && (
              <div className="rounded-full bg-green-100 p-1.5">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            )}
            {item.type === "warning" && (
              <div className="rounded-full bg-amber-100 p-1.5">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
            )}
            {item.type === "info" && (
              <div className="rounded-full bg-blue-100 p-1.5">
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
            )}
            {item.type === "error" && (
              <div className="rounded-full bg-red-100 p-1.5">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none text-green-900">{item.message}</p>
            <p className="text-sm text-green-500">{item.timestamp}</p>
          </div>
        </div>
      ))}
      <div className="text-center">
        <button
          onClick={fetchActivities}
          className="text-sm text-green-600 hover:text-green-700 hover:underline transition-colors"
        >
          Atualizar atividades
        </button>
      </div>
    </div>
  )
}
