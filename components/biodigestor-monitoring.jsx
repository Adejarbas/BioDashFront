"use client"

import React, { useState, useEffect, useRef } from "react"
import { AlertCircle, Thermometer, Gauge, DropletsIcon } from "lucide-react"
import SupportModal from "@/components/support-modal"
import { sendAlertEmail } from "../lib/actions"

const BiodigestorMonitoring = () => {
  // --- Estados ---
  const [temperature, setTemperature] = useState(35)
  const [pressure, setPressure] = useState(1.5)
  const [ph, setPh] = useState(7.0)
  const [showAlert, setShowAlert] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)

  // --- Constantes ---
  const TEMP_THRESHOLD = 40           // Temperatura crítica
  const WINDOW_MS = 60 * 1000         // Janela de 1 minuto (60s)

  // --- Refs ---
  const emailSentRef = useRef(false)
  const modalRef = useRef(null)

  const thresholdEventsRef = useRef([])      // timestamps das ultrapassagens
  const prevTempRef = useRef(temperature)    // temperatura anterior

  const openSupport = () => {
    if (modalRef.current && modalRef.current.open) {
      modalRef.current.open()
    }
  }

  // ========================================================================
  // EFEITO 1: SIMULAÇÃO (Matemática Pura)
  // ========================================================================
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed((prev) => (prev + 1) % 13)

      // Lógica de variação da temperatura
      if (timeElapsed >= 5 && timeElapsed < 10) {
        setTemperature((prev) => prev + 1.5)
      } else if (timeElapsed >= 10) {
        setTemperature((prev) => {
          const newTemp = prev - 1.2
          return newTemp < 35 ? 35 : newTemp
        })
      } else {
        setTemperature((prev) => {
          const variation = (Math.random() - 0.5) * 0.5
          return Math.max(34.5, Math.min(35.5, prev + variation))
        })
      }

      // Variação de Pressão e pH
      setPressure((prev) =>
        Math.max(1.3, Math.min(1.7, prev + (Math.random() - 0.5) * 0.1))
      )
      setPh((prev) =>
        Math.max(6.8, Math.min(7.2, prev + (Math.random() - 0.5) * 0.1))
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [timeElapsed])

  // ========================================================================
  // EFEITO 2: MONITORAMENTO (envia e-mail sempre que passar do limite)
  //           + contador de ultrapassagens em 1 minuto
  // ========================================================================
  useEffect(() => {
    const now = Date.now()
    const prevTemp = prevTempRef.current

    // Detecta cruzamento do limite: de <= limite para > limite
    if (prevTemp <= TEMP_THRESHOLD && temperature > TEMP_THRESHOLD) {
      // Atualiza lista de eventos e remove os mais antigos que 1 minuto
      const updatedEvents = [
        ...thresholdEventsRef.current,
        now
      ].filter((ts) => now - ts <= WINDOW_MS)

      thresholdEventsRef.current = updatedEvents

      console.log(
        `🔥 Temperatura ultrapassou o limite. Ocorrências nos últimos 60s: ${updatedEvents.length}`
      )

      // Lógica antiga: sempre envia e-mail quando passa do limite,
      // com trava para não mandar repetido enquanto permanecer crítico.
      setShowAlert(true) // alerta visual aparece e NÃO some mais

      if (!emailSentRef.current) {
        emailSentRef.current = true

        console.group("🔥 ALERTA DE TEMPERATURA DISPARADO")
        console.log(`🌡️ Temperatura: ${temperature.toFixed(1)}°C`)
        console.log(
          "📈 Ocorrências acima do limite nos últimos 60s:",
          updatedEvents.length
        )

        sendAlertEmail(temperature)
          .then((result) => {
            if (result && result.success) {
              console.log("✅ SUCESSO: E-mail entregue.", result.data)
            } else {
              console.error("❌ FALHA NO ENVIO:", result?.error)
            }
          })
          .catch((err) => console.error("❌ ERRO DE REDE:", err))
          .finally(() => console.groupEnd())
      }
    }

    // Rearma apenas o envio de e-mail quando a temperatura volta a ficar segura.
    // NÃO escondemos o alerta visual (showAlert continua true).
    if (temperature < 36 && emailSentRef.current) {
      console.log("❄️ Temperatura normalizada. Sistema rearmado para novos envios.")
      emailSentRef.current = false
      // Importante: NÃO limpamos thresholdEventsRef aqui,
      // para manter o contador de ocorrências da janela de 1 minuto.
    }

    prevTempRef.current = temperature
  }, [temperature])

  // ========================================================================
  // UI / RENDERIZAÇÃO
  // ========================================================================
  return (
    <>
      <SupportModal ref={modalRef} showFloatingTrigger={false} />

      <div className="fixed bottom-4 right-4 space-y-2 w-72 z-[9999]">
        {/* Card Temperatura */}
        <div className="bg-white p-4 rounded-lg shadow transition-all duration-300">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <Thermometer
                className={`w-5 h-5 ${
                  temperature > TEMP_THRESHOLD ? "text-red-500" : "text-blue-500"
                }`}
              />
              <span>Temperatura</span>
            </div>
            <span
              className={
                temperature > TEMP_THRESHOLD ? "text-red-500 font-bold" : "font-bold"
              }
            >
              {temperature.toFixed(1)}°C
            </span>
          </div>
        </div>

        {/* Card Pressão */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-green-500" />
              <span>Pressão</span>
            </div>
            <span className="font-bold">{pressure.toFixed(2)} bar</span>
          </div>
        </div>

        {/* Card pH */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <DropletsIcon className="w-5 h-5 text-purple-500" />
              <span>pH</span>
            </div>
            <span className="font-bold">{ph.toFixed(1)}</span>
          </div>
        </div>

        {/* Alerta Crítico */}
        {showAlert && (
          <div className="bg-red-100 rounded-lg shadow border border-red-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="font-bold text-red-700">Temperatura Crítica!</span>
              </div>
              <p className="text-xs text-red-800 mb-3 leading-snug">
                Notificação enviada automaticamente para o e-mail do responsável.
              </p>
              <button
                onClick={openSupport}
                className="w-full bg-red-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-red-700 transition-colors shadow-md"
              >
                Solicitar Manutenção
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default BiodigestorMonitoring
