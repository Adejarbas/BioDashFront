"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L, { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/lib/supabase/client";

// Corrigir ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Marcador = {
  dbId?: string;
  nome: string;
  descricao: string;
  pos: LatLngTuple;
};

const cidades = [
  {
    nome: "Uberlândia – MG",
    pos: [-18.9146, -48.2757] as LatLngTuple,
    info: `Rodovia BR-452, km 142\nCEP 38407-049\nZona Rural\nUberlândia – MG`,
  },
  {
    nome: "Holambra – SP",
    pos: [-22.6406, -47.0481] as LatLngTuple,
    info: `Estrada Municipal HBR-333, s/n\nFazenda Ribeirão Zona Rural\nHolambra – SP\nCEP 13825-000`,
  },
  {
    nome: "Aracati – CE",
    pos: [-4.5586, -37.7676] as LatLngTuple,
    info: `Rodovia CE 263 de Aracati à Jaguaruana, Km 4,0\nMata Fresca, Zona Rural\nCEP 62800-000\nAracati – CE`,
  },
];

// ========================
//   Helpers de Supabase
// ========================
async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? null;
}

async function insertAddress(address: string): Promise<string | null> {
  const user_id = await getCurrentUserId();
  if (!user_id) return null;

  const { data, error } = await supabase
    .from("biodigestor_maps")
    .insert([{ user_id, address }])
    .select("id")
    .single();

  if (error) return null;
  return data?.id ?? null;
}

// ========================
// COMPONENTE: Captura Clique
// ========================
function ClickHandler({
  modoClique,
  onAdd,
}: {
  modoClique: boolean;
  onAdd: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!modoClique) return;
      onAdd(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

// ========================
// COMPONENTE: FlyTo
// ========================
function FlyTo({ pos, zoom }: { pos: LatLngTuple; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(pos, zoom);
  }, [pos, zoom, map]);

  return null;
}

// ========================
// COMPONENTE PRINCIPAL
// ========================
export default function LeafletMap({ className = "" }) {
  // Evita erro de hidratação
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const [marcadores, setMarcadores] = useState<Marcador[]>(
    cidades.map((c) => ({ nome: c.nome, descricao: c.info, pos: c.pos }))
  );

  const [coordenadas, setCoordenadas] = useState<LatLngTuple>(cidades[0].pos);
  const [zoom, setZoom] = useState(6);

  const [modoClique, setModoClique] = useState(false);

  if (!hydrated) {
    return (
      <div className="w-full h-[520px] rounded-lg bg-gray-200 animate-pulse">
        Carregando mapa...
      </div>
    );
  }

  // =========================
  // Carregar endereços salvos
  // =========================
  useEffect(() => {
    (async () => {
      const user_id = await getCurrentUserId();
      if (!user_id) return;

      const { data } = await supabase
        .from("biodigestor_maps")
        .select("id, address, created_at")
        .eq("user_id", user_id);

      if (!data?.length) return;

      const markers: Marcador[] = [];
      for (const row of data) {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(row.address)}`
        );

        const json = await resp.json();
        if (json.length > 0) {
          markers.push({
            dbId: row.id,
            nome: row.address.split(",")[0],
            descricao: row.address,
            pos: [parseFloat(json[0].lat), parseFloat(json[0].lon)],
          });
        }
      }

      setMarcadores((prev) => [...prev, ...markers]);
    })();
  }, []);

  async function handleAddMarker(lat: number, lon: number) {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
    );
    const j = await resp.json();

    const endereco = j.display_name ?? `${lat}, ${lon}`;
    const dbId = await insertAddress(endereco);

    setMarcadores((prev) => [
      ...prev,
      { dbId: dbId ?? undefined, nome: "Local salvo", descricao: endereco, pos: [lat, lon] },
    ]);

    setModoClique(false);
  }

  return (
    <div className={`w-full rounded-lg p-2 bg-green-50 border border-green-200`}>
      <MapContainer
        center={coordenadas}
        zoom={zoom}
        style={{ height: "520px", width: "100%", borderRadius: 15 }}
        scrollWheelZoom
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {marcadores.map((m, i) => (
          <Marker key={m.dbId ?? i} position={m.pos}>
            <Popup>
              <strong>{m.nome}</strong>
              <br />
              {m.descricao}
            </Popup>
          </Marker>
        ))}

        <ClickHandler modoClique={modoClique} onAdd={handleAddMarker} />
        <FlyTo pos={coordenadas} zoom={zoom} />
      </MapContainer>
    </div>
  );
}
