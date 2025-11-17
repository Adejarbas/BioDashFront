// components/MapWrapper.tsx
"use client";

import dynamic from "next/dynamic";

// Importação dinâmica para evitar SSR do Leaflet (obrigatório)
const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,       // impede renderização no servidor
  loading: () => (
    <div className="w-full h-[520px] bg-gray-200 animate-pulse rounded-lg">
      Carregando mapa...
    </div>
  ),
});

export default function MapWrapper() {
  return (
    <div className="relative" style={{ height: "520px", width: "100%", zIndex: 1 }}>
      <LeafletMap />
    </div>
  );
}
