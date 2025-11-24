"use client";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const LeafletMap = dynamic(() => import("@/components/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 520 }} className="flex items-center justify-center w-full rounded-lg bg-gray-200 animate-pulse">
      Carregando mapa...
    </div>
  ),
});

export function DashboardMapSection() {
  const handleAddMarker = () => {
    // Chama a função exposta globalmente pelo LeafletMap
    if (typeof window !== 'undefined' && (window as any).__openBiodigestorModal) {
      (window as any).__openBiodigestorModal();
    }
  };

  return (
    <Card className="bio-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Localização da Empresa
            </CardTitle>
            <CardDescription className="text-green-600">
              Localização do biodigestor e instalações da empresa
            </CardDescription>
          </div>
          <Button onClick={handleAddMarker} variant="default">
            Adicionar Marcador
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full z-[0]">
          <LeafletMap />
        </div>
      </CardContent>
    </Card>
  );
}
