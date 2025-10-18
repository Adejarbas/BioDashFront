"use client"

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react"
import { X, Calendar, MessageCircle, Phone, Clock } from "lucide-react"

const STORAGE_KEY = "support_schedule"

const SupportModal = forwardRef(function SupportModal(props, ref) {
  const { showFloatingTrigger = true } = props

  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)

  const [scheduled, setScheduled] = useState(null) // { name, iso }
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    issue: "",
    priority: "medium",
    date: "",
    time: "",
  })

  // Expor método open() para ser chamado pelo componente pai
  useImperativeHandle(ref, () => ({
    open: () => {
      setIsOpen(true)
      setStep(1)
    },
  }))

  // Carrega agendamento salvo no toast
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.iso && !isNaN(new Date(parsed.iso).getTime())) {
          setScheduled(parsed)
        }
      }
    } catch {}
  }, [])

  // Texto amigável da data/hora do agendamento
  const formatted = useMemo(() => {
    if (!scheduled) return null
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(scheduled.iso))
    } catch {
      return new Date(scheduled.iso).toLocaleString("pt-BR")
    }
  }, [scheduled])

  function nextStep() {
    setStep((s) => Math.min(3, s + 1))
  }

  function prevStep() {
    setStep((s) => Math.max(1, s - 1))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const { name, date, time } = formData
    if (!date || !time) return
    const iso = new Date(`${date}T${time}:00`).toISOString()
    const payload = { name: name || "Suporte", iso }

    setScheduled(payload)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {}

    // feedback simples (opcional): você pode trocar por um toast da sua lib
    // alert("Agendamento solicitado com sucesso! Entraremos em contato em breve.")

    setIsOpen(false)
    setStep(1)
    setFormData({
      name: "",
      email: "",
      phone: "",
      issue: "",
      priority: "medium",
      date: "",
      time: "",
    })
  }

  function handleDismissToast() {
    setScheduled(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }

  function handleEditFromToast() {
    if (!scheduled) return
    const d = new Date(scheduled.iso)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    const hh = String(d.getHours()).padStart(2, "0")
    const mi = String(d.getMinutes()).padStart(2, "0")

    setFormData((prev) => ({
      ...prev,
      name: scheduled.name,
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${mi}`,
    }))
    setStep(3)
    setIsOpen(true)
  }

  return (
    <>
      {/* Botão flutuante (opcional) */}
      {showFloatingTrigger && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
          aria-label="Abrir agendamento de suporte"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Toast flutuante com o agendamento salvo */}
      {scheduled && (
        <div className="relative top-24 right-24 z-[10] max-w-xs">
          <div className="rounded-xl border border-emerald-200 bg-white/95 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-white/80 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-emerald-700">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">Suporte agendado</p>
                <p className="text-sm text-gray-700 truncate" title={formatted ?? ""}>
                  {formatted}
                </p>
                <p className="text-[11px] text-gray-500 mt-1 truncate" title={scheduled.name}>
                  Responsável: {scheduled.name}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleEditFromToast}
                    className="rounded-md px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                  >
                    Ver/Editar
                  </button>
                  <button
                    onClick={handleDismissToast}
                    className="rounded-md px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                  >
                    Dispensar
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismissToast}
                className="ml-auto text-gray-400 hover:text-gray-600"
                aria-label="Fechar lembrete"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" style={{ zIndex: 9999}}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold">Agendar Suporte</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Indicador de passos */}
            <div className="px-6 py-4 border-b">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"}`}>1</div>
                <div className={`flex-1 h-1 ${step >= 2 ? "bg-green-600" : "bg-gray-200"}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"}`}>2</div>
                <div className={`flex-1 h-1 ${step >= 3 ? "bg-green-600" : "bg-gray-200"}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 3 ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"}`}>3</div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                <span>Dados</span>
                <span>Problema</span>
                <span>Agendamento</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              {/* Passo 1: Dados pessoais */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Seus dados</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              )}

              {/* Passo 2: Problema */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Descreva o problema</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="low">Baixa - Dúvida geral</option>
                      <option value="medium">Média - Problema técnico</option>
                      <option value="high">Alta - Sistema parado</option>
                      <option value="urgent">Urgente - Emergência</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição detalhada</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.issue}
                      onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                      placeholder="Descreva o problema que está enfrentando..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              )}

              {/* Passo 3: Agendamento */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Quando podemos te ajudar?</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data preferida</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horário preferido</label>
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Resumo */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Resumo do agendamento:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Nome:</strong> {formData.name}</p>
                      <p><strong>Email:</strong> {formData.email}</p>
                      <p><strong>Prioridade:</strong> {formData.priority}</p>
                      <p><strong>Data:</strong> {formData.date}</p>
                      <p><strong>Horário:</strong> {formData.time}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navegação */}
              <div className="flex justify-between mt-6">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Voltar
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="ml-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Próximo
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="ml-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Agendar Suporte</span>
                  </button>
                )}
              </div>
            </form>

            {/* Contatos alternativos (rodapé) */}
            <div className="px-6 py-4 bg-gray-50 border-t">
              <p className="text-sm text-gray-600 mb-2">Ou entre em contato diretamente:</p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Phone className="h-4 w-4 text-green-600" />
                  <span>(11) 9999-9999</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span>Seg-Sex 8h-18h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
})

export default SupportModal
