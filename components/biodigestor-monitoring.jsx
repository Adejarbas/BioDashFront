"use client"

import React, { useState, useEffect, useRef } from "react"
import { AlertCircle, Thermometer, Gauge, DropletsIcon } from "lucide-react"
import SupportModal from "@/components/support-modal"

const BiodigestorMonitoring = () => {
  const [temperature, setTemperature] = useState(35)
  const [pressure, setPressure] = useState(1.5)
  const [ph, setPh] = useState(7.0)
  const [showAlert, setShowAlert] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)

  const modalRef = useRef(null)
  const openSupport = () => modalRef.current?.open()

  // simulação da lógica existente
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed((prev) => (prev + 1) % 13)

      if (timeElapsed >= 5 && timeElapsed < 10) {
        setTemperature((prev) => {
          const newTemp = prev + 1.5
          if (newTemp > 40) setShowAlert(true)
          return newTemp
        })
      } else if (timeElapsed >= 10) {
        setTemperature((prev) => {
          const newTemp = prev - 1.2
          if (newTemp < 36) {
            setShowAlert(false)
            return 35
          }
          return newTemp
        })
      } else {
        setTemperature((prev) => {
          const variation = (Math.random() - 0.5) * 0.5
          return Math.max(34.5, Math.min(35.5, prev + variation))
        })
      }

      setPressure((prev) => Math.max(1.3, Math.min(1.7, prev + (Math.random() - 0.5) * 0.1)))
      setPh((prev) => Math.max(6.8, Math.min(7.2, prev + (Math.random() - 0.5) * 0.1)))
    }, 2000)

    return () => clearInterval(interval)
  }, [timeElapsed])

  return (
    <>
      {/* monta o modal uma vez, escondendo o botão flutuante interno */}
      <SupportModal ref={modalRef} showFloatingTrigger={false} />

      <div className="fixed bottom-4 right-4 space-y-2 w-72 z-[9999]">
        {/* cartões */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className={`w-5 h-5 ${temperature > 40 ? "text-red-500" : "text-blue-500"}`} />
              <span>Temperatura</span>
            </div>
            <span className={temperature > 40 ? "text-red-500 font-bold" : "font-bold"}>
              {temperature.toFixed(1)}°C
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-green-500" />
              <span>Pressão</span>
            </div>
            <span className="font-bold">{pressure.toFixed(2)} bar</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <DropletsIcon className="w-5 h-5 text-purple-500" />
              <span>pH</span>
            </div>
            <span className="font-bold">{ph.toFixed(1)}</span>
          </div>
        </div>

        {/* alerta com botão que abre o modal */}
        {showAlert && (
          <div className="bg-red-100 rounded-lg shadow border border-red-200">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-700">Temperatura muito elevada!</span>
              </div>
              <button
                onClick={openSupport}
                className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
              >
                Agende agora uma manutenção
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default BiodigestorMonitoring
