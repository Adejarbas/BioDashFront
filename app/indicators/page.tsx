"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import { Plus, Edit, Trash2, Activity, Zap, Thermometer, Droplets, History } from "lucide-react"

interface Indicator {
  id: string
  name: string
  type: string
  unit: string
  min_value: number
  max_value: number
  current_value: number
  status: string
  created_at: string
}

interface IndicatorHistory {
  id: string
  indicator_id: string
  value: number
  timestamp: string
  indicator_name: string
  unit: string
}

export default function IndicatorsPage() {
  const { toast } = useToast()
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [history, setHistory] = useState<IndicatorHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "temperature",
    unit: "",
    min_value: 0,
    max_value: 100,
    current_value: 0,
  })

  useEffect(() => {
    loadIndicators()
    loadHistory()
    initializeDefaultIndicators()
  }, [])

  const initializeDefaultIndicators = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: existingIndicators } = await supabase
        .from("biodigester_indicators")
        .select("name")
        .eq("user_id", user.id)

      const existingNames = existingIndicators?.map((i) => i.name) || []

      const defaultIndicators = [
        {
          name: "Energia Gerada",
          type: "energy",
          unit: "kWh",
          min_value: 0,
          max_value: 1000,
          current_value: 245.8,
        },
        {
          name: "Resíduos Processados",
          type: "flow",
          unit: "kg",
          min_value: 0,
          max_value: 500,
          current_value: 156.2,
        },
        {
          name: "Imposto Abatido",
          type: "energy",
          unit: "R$",
          min_value: 0,
          max_value: 5000,
          current_value: 1247.5,
        },
      ]

      for (const indicator of defaultIndicators) {
        if (!existingNames.includes(indicator.name)) {
          const status = getStatus(indicator.current_value, indicator.min_value, indicator.max_value)

          const { data: newIndicator, error } = await supabase
            .from("biodigester_indicators")
            .insert({
              ...indicator,
              user_id: user.id,
              status,
            })
            .select()
            .single()

          if (!error && newIndicator) {
            await supabase.from("indicator_history").insert({
              indicator_id: newIndicator.id,
              value: indicator.current_value,
              timestamp: new Date().toISOString(),
            })
          }
        }
      }
    } catch (error) {
      console.error("Error initializing default indicators:", error)
    }
  }

  const loadHistory = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("indicator_history")
        .select(`
          id,
          indicator_id,
          value,
          timestamp,
          biodigester_indicators!inner(name, unit, user_id)
        `)
        .eq("biodigester_indicators.user_id", user.id)
        .order("timestamp", { ascending: false })
        .limit(100)

      if (error) {
        console.error("Error loading history:", error)
        toast({
          title: "Aviso",
          description: "Histórico será carregado conforme você atualizar os indicadores.",
          variant: "default",
        })
        return
      }

      const formattedHistory =
        data?.map((item: any) => ({
          id: item.id,
          indicator_id: item.indicator_id,
          value: item.value,
          timestamp: item.timestamp,
          indicator_name: item.biodigester_indicators.name,
          unit: item.biodigester_indicators.unit,
        })) || []

      setHistory(formattedHistory)
    } catch (error) {
      console.error("Error loading history:", error)
    }
  }

  const loadIndicators = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("biodigester_indicators")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setIndicators(data || [])
    } catch (error) {
      console.error("Error loading indicators:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os indicadores.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const status = getStatus(formData.current_value, formData.min_value, formData.max_value)

      if (editingId) {
        const { error } = await supabase
          .from("biodigester_indicators")
          .update({
            name: formData.name,
            type: formData.type,
            unit: formData.unit,
            min_value: formData.min_value,
            max_value: formData.max_value,
            current_value: formData.current_value,
            status,
          })
          .eq("id", editingId)
          .eq("user_id", user.id)

        if (error) throw error

        await supabase.from("indicator_history").insert({
          indicator_id: editingId,
          value: formData.current_value,
          timestamp: new Date().toISOString(),
        })

        toast({ title: "Sucesso", description: "Indicador atualizado com sucesso." })
      } else {
        const { data: newIndicator, error } = await supabase
          .from("biodigester_indicators")
          .insert({
            ...formData,
            user_id: user.id,
            status,
          })
          .select()
          .single()

        if (error) throw error

        if (newIndicator) {
          await supabase.from("indicator_history").insert({
            indicator_id: newIndicator.id,
            value: formData.current_value,
            timestamp: new Date().toISOString(),
          })
        }

        toast({ title: "Sucesso", description: "Indicador criado com sucesso." })
      }

      resetForm()
      loadIndicators()
      loadHistory()
    } catch (error) {
      console.error("Error saving indicator:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o indicador.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (indicator: Indicator) => {
    setFormData({
      name: indicator.name,
      type: indicator.type,
      unit: indicator.unit,
      min_value: indicator.min_value,
      max_value: indicator.max_value,
      current_value: indicator.current_value,
    })
    setEditingId(indicator.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este indicador?")) return

    try {
      await supabase.from("indicator_history").delete().eq("indicator_id", id)

      const { error } = await supabase.from("biodigester_indicators").delete().eq("id", id)

      if (error) throw error
      toast({ title: "Sucesso", description: "Indicador excluído com sucesso." })
      loadIndicators()
      loadHistory()
    } catch (error) {
      console.error("Error deleting indicator:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o indicador.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: "temperature",
      unit: "",
      min_value: 0,
      max_value: 100,
      current_value: 0,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const getStatus = (current: number, min: number, max: number) => {
    if (current < min || current > max) return "critical"
    if (current < min * 1.1 || current > max * 0.9) return "warning"
    return "normal"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-green-100 text-green-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "critical":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "temperature":
        return <Thermometer className="h-4 w-4" />
      case "pressure":
        return <Activity className="h-4 w-4" />
      case "flow":
        return <Droplets className="h-4 w-4" />
      case "energy":
        return <Zap className="h-4 w-4" />
      case "ph":
        return <Activity className="h-4 w-4" />
      case "gas":
        return <Activity className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Indicadores do Biodigestor"
        text="Gerencie e monitore os indicadores de performance do seu biodigestor"
      />

      <div className="grid gap-6">
        <div className="flex gap-2">
          <Button
            variant={!showHistory ? "default" : "outline"}
            onClick={() => setShowHistory(false)}
            className={!showHistory ? "bg-green-600 hover:bg-green-700" : "border-green-300 text-green-700"}
          >
            <Activity className="h-4 w-4 mr-2" />
            Indicadores
          </Button>
          <Button
            variant={showHistory ? "default" : "outline"}
            onClick={() => setShowHistory(true)}
            className={showHistory ? "bg-green-600 hover:bg-green-700" : "border-green-300 text-green-700"}
          >
            <History className="h-4 w-4 mr-2" />
            Histórico
          </Button>
        </div>

        {showHistory ? (
          <Card className="bio-card">
            <CardHeader>
              <CardTitle className="text-green-800">Histórico de Valores</CardTitle>
              <CardDescription className="text-green-600">
                Histórico temporal dos valores registrados para cada indicador
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-green-600">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum histórico encontrado.</p>
                  <p className="text-sm">Os valores serão registrados conforme você atualizar os indicadores.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Indicador</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{formatTimestamp(entry.timestamp)}</TableCell>
                        <TableCell>{entry.indicator_name}</TableCell>
                        <TableCell className="font-semibold">
                          {entry.value} {entry.unit}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Add/Edit Form */}
            {showForm && (
              <Card className="bio-card">
                <CardHeader>
                  <CardTitle className="text-green-800">{editingId ? "Editar Indicador" : "Novo Indicador"}</CardTitle>
                  <CardDescription className="text-green-600">
                    Configure os parâmetros de monitoramento do biodigestor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-green-800">
                          Nome do Indicador
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                          className="border-green-300 focus:border-green-500"
                          placeholder="Ex: Temperatura do Reator"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type" className="text-green-800">
                          Tipo
                        </Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger className="border-green-300 focus:border-green-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="temperature">Temperatura</SelectItem>
                            <SelectItem value="pressure">Pressão</SelectItem>
                            <SelectItem value="flow">Fluxo</SelectItem>
                            <SelectItem value="energy">Energia</SelectItem>
                            <SelectItem value="ph">pH</SelectItem>
                            <SelectItem value="gas">Gás</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="unit" className="text-green-800">
                          Unidade
                        </Label>
                        <Input
                          id="unit"
                          value={formData.unit}
                          onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                          className="border-green-300 focus:border-green-500"
                          placeholder="°C, bar, L/h"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="min_value" className="text-green-800">
                          Valor Mínimo
                        </Label>
                        <Input
                          id="min_value"
                          type="number"
                          step="0.01"
                          value={formData.min_value}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, min_value: Number.parseFloat(e.target.value) }))
                          }
                          className="border-green-300 focus:border-green-500"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max_value" className="text-green-800">
                          Valor Máximo
                        </Label>
                        <Input
                          id="max_value"
                          type="number"
                          step="0.01"
                          value={formData.max_value}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, max_value: Number.parseFloat(e.target.value) }))
                          }
                          className="border-green-300 focus:border-green-500"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="current_value" className="text-green-800">
                          Valor Atual
                        </Label>
                        <Input
                          id="current_value"
                          type="number"
                          step="0.01"
                          value={formData.current_value}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, current_value: Number.parseFloat(e.target.value) }))
                          }
                          className="border-green-300 focus:border-green-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                        {isLoading ? "Salvando..." : editingId ? "Atualizar" : "Criar Indicador"}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Indicators List */}
            <Card className="bio-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-green-800">Indicadores Cadastrados</CardTitle>
                    <CardDescription className="text-green-600">
                      Lista de todos os indicadores configurados para monitoramento
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={showForm}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Indicador
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {indicators.length === 0 ? (
                  <div className="text-center py-8 text-green-600">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum indicador cadastrado ainda.</p>
                    <p className="text-sm">Clique em "Novo Indicador" para começar.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Indicador</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Faixa</TableHead>
                        <TableHead>Valor Atual</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {indicators.map((indicator) => (
                        <TableRow key={indicator.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(indicator.type)}
                              {indicator.name}
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{indicator.type}</TableCell>
                          <TableCell>
                            {indicator.min_value} - {indicator.max_value} {indicator.unit}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {indicator.current_value} {indicator.unit}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(indicator.status)}>
                              {indicator.status === "normal" && "Normal"}
                              {indicator.status === "warning" && "Atenção"}
                              {indicator.status === "critical" && "Crítico"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(indicator)}
                                className="border-green-300 text-green-700 hover:bg-green-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(indicator.id)}
                                className="border-red-300 text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardShell>
  )
}
