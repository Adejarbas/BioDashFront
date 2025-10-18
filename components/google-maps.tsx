"use client"

interface GoogleMapsProps {
  address: string
  className?: string
}

export function GoogleMaps({ address, className = "" }: GoogleMapsProps) {
  return (
    <div
      className={`w-full h-64 rounded-lg overflow-hidden border border-green-200 bg-green-50 flex items-center justify-center ${className}`}
    >
      <div className="text-center p-4">
        <div className="text-green-600 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-green-700 font-medium">Localização da Empresa</p>
        <p className="text-green-600 text-sm mt-1">{address || "Endereço não configurado"}</p>
        <p className="text-green-500 text-xs mt-2">Mapa interativo disponível em produção</p>
      </div>
    </div>
  )
}
