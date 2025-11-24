import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
// (sem import dynamic aqui; wrapper client cuidará do carregamento do mapa)
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Overview } from "@/components/overview"
import { DashboardStats } from "@/components/dashboard-stats"
import { MapPin } from "lucide-react"
import { DashboardMapSection } from "@/components/dashboard-map-section"
import BiodigestorMonitoring from "@/components/biodigestor-monitoring"
import { ExportReports } from "@/components/export-reports"

// --- Helper para criar o cliente Supabase no Servidor ---
const createSupabaseServerClient = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: async (name: string) => (await cookieStore).get(name)?.value,
      },
    }
  )
}

// Removido dynamic aqui; usamos componente client `DashboardMapSection`.


export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard do Biodigestor" text="Monitore e gerencie o desempenho do seu biodigestor" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStats />
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 bio-card">
              <CardHeader>
                <CardTitle className="text-green-800">Visão Geral de Desempenho</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
            <Card className="col-span-3 bio-card">
              <CardHeader>
                <CardTitle className="text-green-800">Manutenções Agendadas</CardTitle>
                <CardDescription className="text-green-600">Últimas manutenções agendadas</CardDescription>
              </CardHeader>
              <CardContent>
                <BiodigestorMonitoring />
              </CardContent>
            </Card>
            {/* Exportações ocupam linha completa abaixo */}
            <Card className="col-span-7 bio-card">
              <CardHeader>
                <CardTitle className="text-green-800">Exportar Relatórios</CardTitle>
                <CardDescription className="text-green-600">Gere PDF, Excel ou CSV com gráficos e métricas</CardDescription>
              </CardHeader>
              <CardContent>
                <ExportReports />
              </CardContent>
            </Card>
          </div>
          <DashboardMapSection />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}