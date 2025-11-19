// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { Overview } from "@/components/overview";
import { DashboardStats } from "@/components/dashboard-stats";
import { ExportButtons } from "@/components/export-buttons";
import { BarChart3, TrendingUp, AlertCircle, FileText, Bell, MapPin } from "lucide-react";
import MapWrapper from "@/components/map-wrapper";
import BiodigestorMonitoring from "@/components/biodigestor-monitoring";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3003").replace(/\/+$/, "");

// formatting helpers (mantive os seus)
const fmtBRNumber = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const fmtBRInt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const fmtBRCurrency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtMonthLong = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function startOfNextMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 1) }

type IndicatorRow = {
  energy_generated: number | null
  waste_processed: number | null
  tax_savings: number | null
  efficiency: number | null
  measured_at?: string | null
  created_at?: string | null
}

async function fetchJSON(url: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');
  
  const headers: HeadersInit = {};
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }
  
  const res = await fetch(url, { 
    method: "GET", 
    cache: "no-store",
    headers,
  });
  if (res.status === 401) return { auth: false };
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${res.statusText}`);
  const j = await res.json();
  return j;
}

async function fetchRange(fromISO: string, toISO: string, userId?: string) {
  const params = new URLSearchParams({ from: fromISO, to: toISO });
  if (userId) params.set("userId", userId);
  const url = `${API_BASE}/api/indicators?${params.toString()}`;
  const json = await fetchJSON(url);
  if (json.auth === false) return { auth: false };
  return json.data ?? [];
}

async function fetchLatest(userId?: string) {
  const url = `${API_BASE}/api/indicators/latest${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`;
  const json = await fetchJSON(url);
  if (json.auth === false) return { auth: false };
  return json.data ?? null;
}

function sum(rows: IndicatorRow[]) {
  let energy = 0, waste = 0, tax = 0, effTotal = 0, effCount = 0;
  for (const r of rows) {
    energy += Number(r.energy_generated ?? 0);
    waste += Number(r.waste_processed ?? 0);
    tax += Number(r.tax_savings ?? 0);
    if (r.efficiency !== null && r.efficiency !== undefined) { effTotal += Number(r.efficiency); effCount++; }
  }
  const avgEff = effCount ? effTotal / effCount : null;
  return { energy, waste, tax, avgEff };
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1) Verifica sessão com backend
  const userResp = await fetchJSON(`${API_BASE}/api/user`);
  if (userResp.auth === false || !userResp.success || !userResp.user) {
    // sem sessão -> redirect para /login
    redirect("/login");
  }
  const user = userResp.user;

  // Períodos
  const now = new Date();
  const today = startOfDay(now);
  const weekFrom = startOfDay(addDays(today, -6));
  const weekTo = addDays(today, 1);
  const prevWeekTo = startOfDay(addDays(weekFrom, 0));
  const prevWeekFrom = startOfDay(addDays(prevWeekTo, -7));
  const monthFrom = startOfMonth(today);
  const monthTo = startOfNextMonth(today);

  // Buscas paralelas
  const [weekRows, prevWeekRows, monthRows, latestRow] = await Promise.all([
    fetchRange(weekFrom.toISOString(), weekTo.toISOString(), user.id),
    fetchRange(prevWeekFrom.toISOString(), prevWeekTo.toISOString(), user.id),
    fetchRange(monthFrom.toISOString(), monthTo.toISOString(), user.id),
    fetchLatest(user.id),
  ]);

  // Caso backend retorne auth:false (sessão expirou entre requests)
  if ((weekRows as any)?.auth === false || (prevWeekRows as any)?.auth === false || (monthRows as any)?.auth === false || (latestRow as any)?.auth === false) {
    redirect("/login");
  }

  const weekAgg = sum(weekRows as IndicatorRow[]);
  const prevWeekAgg = sum(prevWeekRows as IndicatorRow[]);
  const monthAgg = sum(monthRows as IndicatorRow[]);

  const pct = (curr: number, prev: number) => (prev ? ((curr - prev) / prev) * 100 : null);
  const energyWeekDelta = pct(weekAgg.energy, prevWeekAgg.energy);
  const wasteWeekDelta = pct(weekAgg.waste, prevWeekAgg.waste);

  const effCurrent = (latestRow as IndicatorRow | null)?.efficiency ?? (monthAgg.avgEff !== null ? monthAgg.avgEff : null);

  const monthLabel = fmtMonthLong.format(monthFrom);
  const weekLabel = `${weekFrom.toLocaleDateString("pt-BR")} - ${addDays(weekTo, -1).toLocaleDateString("pt-BR")}`;

  // Strings formatadas
  const energyWeekStr = fmtBRInt.format(Math.round(weekAgg.energy));
  const wasteWeekStr = fmtBRInt.format(Math.round(weekAgg.waste));
  const energyWeekDeltaStr = energyWeekDelta === null ? "—" : `${energyWeekDelta >= 0 ? "↑" : "↓"} ${fmtBRNumber.format(Math.abs(energyWeekDelta))}%`;
  const wasteWeekDeltaStr = wasteWeekDelta === null ? "—" : `${wasteWeekDelta >= 0 ? "↑" : "↓"} ${fmtBRNumber.format(Math.abs(wasteWeekDelta))}%`;

  const effCurrentStr = effCurrent === null ? "—" : `${fmtBRNumber.format(effCurrent)}%`;
  const effBarWidth = effCurrent === null ? "0%" : `${Math.max(0, Math.min(100, effCurrent))}%`;

  const monthEnergyStr = fmtBRInt.format(Math.round(monthAgg.energy)) + " kWh";
  const monthWasteStr = fmtBRInt.format(Math.round(monthAgg.waste)) + " kg";
  const monthTaxStr = fmtBRCurrency.format(monthAgg.tax);

  const weekEnergyStr = fmtBRInt.format(Math.round(weekAgg.energy)) + " kWh";
  const weekEffStr = weekAgg.avgEff === null ? "—" : `${fmtBRNumber.format(weekAgg.avgEff)}%`;

  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard do Biodigestor" text="Monitore e gerencie o desempenho do seu biodigestor" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStats />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
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
          </div>

          <Card className="bio-card">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localização da Empresa
              </CardTitle>
              <CardDescription className="text-green-600">Localização do biodigestor e instalações da empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full z-[0]">
                <MapWrapper />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* analytics / reports / notifications — mantive seu layout original */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bio-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Análise de Eficiência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700">Eficiência Atual</span>
                    <span className="text-2xl font-bold text-green-800">{effCurrentStr}</span>
                  </div>
                  <div className="w-full bg-green-100 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: effBarWidth }} />
                  </div>
                  <p className="text-xs text-green-600">
                    {effCurrent === null ? "Sem dados de eficiência" : "Baseado no último registro"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bio-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendências de Produção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-green-700">Energia (kWh)</p>
                      <p className="text-xl font-bold text-green-800">{energyWeekStr}</p>
                      <p className="text-xs text-green-600">{energyWeekDeltaStr} vs. semana anterior</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700">Resíduos (kg)</p>
                      <p className="text-xl font-bold text-green-800">{wasteWeekStr}</p>
                      <p className="text-xs text-green-600">{wasteWeekDeltaStr} vs. semana anterior</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Período: {weekLabel}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card className="bio-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Relatórios e Exportações
                </CardTitle>
                <CardDescription className="text-green-600">Gere e exporte relatórios detalhados do seu biodigestor</CardDescription>
              </div>
              <ExportButtons filename="relatorio-biodigestor" />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* seu conteúdo de relatórios (mantido) */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="bio-card">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Central de Notificações
              </CardTitle>
              <CardDescription className="text-green-600">Gerencie alertas e notificações do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* conteúdo mantido */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
