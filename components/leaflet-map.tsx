"use client";

import { useEffect, useState, memo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L, { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Corrigir ícones do Leaflet que quebram no Next.js
if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
}

type Marcador = {
  dbId?: string;
  nome: string;
  descricao: string;
  pos: LatLngTuple;
};

// ========================
//   Helpers de Supabase
// ========================
async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    console.error("Usuário não autenticado - sessão inexistente");
    return null;
  }
  return session.user.id;
}

async function insertAddress(address: string): Promise<string | null> {
  const user_id = await getCurrentUserId();
  if (!user_id) {
    console.error("Usuário não autenticado");
    return null;
  }
  
  console.log("Tentando inserir endereço:", address, "para user_id:", user_id);
  
  const addressJson = { full_address: address };
  
  const { data, error } = await supabase
    .from("biodigestor_maps")
    .insert([{ user_id, address: addressJson }])
    .select("id")
    .single();
    
  if (error) {
    console.error("Erro ao inserir endereço:", error);
    console.error("Detalhes do erro:", JSON.stringify(error, null, 2));
    return null;
  }
  
  console.log("Endereço inserido com sucesso:", data);
  return data?.id?.toString() ?? null;
}

async function deleteAddress(dbId: string): Promise<boolean> {
  const user_id = await getCurrentUserId();
  if (!user_id) {
    console.error("Usuário não autenticado para deletar");
    return false;
  }
  
  const { error } = await supabase
    .from("biodigestor_maps")
    .delete()
    .eq("id", parseInt(dbId))
    .eq("user_id", user_id);
    
  if (error) {
    console.error("Erro ao deletar endereço:", error);
    return false;
  }
  return true;
}

// ========================
// COMPONENTES INTERNOS
// ========================

const FlyTo = memo(function FlyTo({ pos, zoom }: { pos: LatLngTuple; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(pos, zoom);
  }, [pos, zoom, map]);
  return null;
});

// ========================
// COMPONENTE PRINCIPAL
// ========================
type LeafletMapProps = {
  onAddMarkerClick?: () => void;
};

export default function LeafletMap({ onAddMarkerClick }: LeafletMapProps = {}) {
  const [mapKey] = useState<number>(() => Date.now());
  const [marcadores, setMarcadores] = useState<Marcador[]>([]);
  const [coordenadas] = useState<LatLngTuple>([-15.7942, -47.8825]); // Centro do Brasil (Brasília)
  const [zoom] = useState(4);
  const mapRef = useRef<L.Map | null>(null);

  // Modal & formulário
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null);

  const [cep, setCep] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [nome, setNome] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setCep("");
    setNumero("");
    setComplemento("");
    setLogradouro("");
    setBairro("");
    setCidade("");
    setUf("");
    setNome("");
    setErrorSubmit(null);
    setLoadingSubmit(false);
  };

  // Monta endereço legível (sem rótulo CEP para não atrapalhar geocodificação)
  const assembleAddress = () => {
    const partes: string[] = [];
    if (logradouro) partes.push(logradouro);
    if (numero) partes.push(numero);
    if (bairro) partes.push(bairro);
    if (cidade) partes.push(cidade);
    if (uf) partes.push(uf);
    if (cep) partes.push(cep);
    partes.push("Brasil");
    return partes.filter(Boolean).join(", ");
  };

  const lookupCep = async () => {
    const cleaned = cep.replace(/\D/g, "");
    if (cleaned.length !== 8) {
      setErrorSubmit("CEP inválido (precisa de 8 dígitos)");
      return;
    }
    try {
      setErrorSubmit(null);
      const resp = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await resp.json();
      if (data.erro) {
        setErrorSubmit("CEP não encontrado");
        return;
      }
      setLogradouro(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(data.localidade || "");
      setUf(data.uf || "");
      if (!nome) setNome("Biodigestor");
    } catch (e) {
      setErrorSubmit("Erro ao buscar CEP");
    }
  };

  const openNewMarkerModal = () => {
    resetForm();
    setOpenModal(true);
    if (onAddMarkerClick) {
      onAddMarkerClick();
    }
  };

  useEffect(() => {
    (window as any).__openBiodigestorModal = openNewMarkerModal;
    return () => {
      delete (window as any).__openBiodigestorModal;
    };
  }, []);

  const openEditMarkerModal = (m: Marcador) => {
    resetForm();
    setEditingId(m.dbId || null);
    setNome(m.nome);
    setLogradouro(m.descricao.split(",")[0] || "");
    setOpenModal(true);
  };

  const deleteMarker = async (m: Marcador) => {
    if (!confirm(`Tem certeza que deseja excluir o marcador "${m.nome}"?`)) {
      return;
    }

    if (m.dbId) {
      const success = await deleteAddress(m.dbId);
      if (!success) {
        alert("Erro ao excluir marcador do banco de dados");
        return;
      }
    }

    setMarcadores((prev) => prev.filter((marcador) => 
      m.dbId ? marcador.dbId !== m.dbId : marcador !== m
    ));
  };

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Buscar marcadores do usuário
  useEffect(() => {
    const fetchMarkers = async () => {
      const user_id = await getCurrentUserId();
      if (!user_id) {
        console.log("Usuário não autenticado, não buscando marcadores");
        return;
      }

      console.log("Buscando marcadores para user_id:", user_id);

      const { data, error } = await supabase
        .from("biodigestor_maps")
        .select("id, address, created_at")
        .eq("user_id", user_id);
        
      if (error) {
        console.error("Erro ao buscar marcadores:", error);
        return;
      }
      
      if (!data?.length) {
        console.log("Nenhum marcador encontrado para este usuário");
        return;
      }

      console.log("Marcadores encontrados:", data);

      const markers: Marcador[] = [];
      for (const row of data) {
        try {
          const addressStr = typeof row.address === 'string' 
            ? row.address 
            : (row.address as any)?.full_address || JSON.stringify(row.address);
          
          console.log("Geocodificando endereço:", addressStr);
          
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}`
          );
          const json = await resp.json();
          
          if (json.length > 0) {
            markers.push({
              dbId: row.id.toString(),
              nome: addressStr.split(",")[0],
              descricao: addressStr,
              pos: [parseFloat(json[0].lat), parseFloat(json[0].lon)],
            });
          }
        } catch (e) {
          console.error("Erro ao geocodificar endereço:", row.address, e);
        }
      }
      
      console.log("Marcadores processados:", markers);
      setMarcadores(markers);
    };
    
    fetchMarkers();
  }, []);

  const submitMarker = async () => {
    setLoadingSubmit(true);
    setErrorSubmit(null);
    
    try {
      const user_id = await getCurrentUserId();
      if (!user_id) {
        setErrorSubmit("Você precisa estar logado para adicionar marcadores.");
        setLoadingSubmit(false);
        return;
      }

      const addressFull = assembleAddress();
      
      console.log("Endereço montado:", addressFull);
      console.log("Usuário autenticado:", user_id);
      
      if (!logradouro || !cidade || !uf) {
        setErrorSubmit("Preencha pelo menos logradouro, cidade e UF");
        setLoadingSubmit(false);
        return;
      }

      const queries: string[] = [];
      const baseDet = [logradouro, numero, bairro, cidade, uf, "Brasil"].filter(Boolean).join(", ");
      queries.push(baseDet);
      queries.push([logradouro, numero, cidade, uf, "Brasil"].filter(Boolean).join(", "));
      queries.push([logradouro, cidade, uf, "Brasil"].filter(Boolean).join(", "));
      queries.push([cidade, uf, "Brasil"].join(", "));

      let lat: number | null = null;
      let lon: number | null = null;
      
      for (const q of queries) {
        try {
          console.log("Tentando geocodificar:", q);
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
            {
              headers: {
                'User-Agent': 'BioDash/1.0'
              }
            }
          );
          
          if (!resp.ok) {
            console.warn("Erro na resposta da API:", resp.status);
            continue;
          }
          
          const data = await resp.json();
          console.log("Resposta da geocodificação:", data);
          
          if (Array.isArray(data) && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lon = parseFloat(data[0].lon);
            console.log("Coordenadas encontradas:", lat, lon);
            break;
          }
        } catch (err) {
          console.warn("Tentativa falhou para query:", q, err);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (lat === null || lon === null) {
        setErrorSubmit("Não foi possível localizar o endereço. Tente ajustar os dados.");
        setLoadingSubmit(false);
        return;
      }

      if (editingId) {
        console.log("Atualizando marcador existente:", editingId);
        const addressJson = { full_address: addressFull };
        
        const { error } = await supabase
          .from("biodigestor_maps")
          .update({ address: addressJson })
          .eq("id", parseInt(editingId));
          
        if (error) {
          console.error("Erro ao atualizar:", error);
          setErrorSubmit("Erro ao atualizar endereço: " + error.message);
          setLoadingSubmit(false);
          return;
        }
        
        setMarcadores(prev => prev.map(m => 
          m.dbId === editingId 
            ? { ...m, nome: nome || "Biodigestor", descricao: addressFull, pos: [lat!, lon!] } 
            : m
        ));
        
        console.log("Marcador atualizado com sucesso");
      } else {
        console.log("Inserindo novo marcador");
        const dbId = await insertAddress(addressFull);
        
        if (!dbId) {
          setErrorSubmit("Erro ao salvar no banco de dados. Verifique o console.");
          setLoadingSubmit(false);
          return;
        }
        
        console.log("Marcador inserido com ID:", dbId);
        
        const novoMarcador: Marcador = { 
          dbId: dbId, 
          nome: nome || "Biodigestor", 
          descricao: addressFull, 
          pos: [lat!, lon!] 
        };
        
        setMarcadores(prev => [...prev, novoMarcador]);
        console.log("Marcador adicionado ao estado:", novoMarcador);
      }
      
      setOpenModal(false);
      resetForm();
      console.log("Operação concluída com sucesso");
      
    } catch (e) {
      console.error("Erro ao salvar marcador:", e);
      setErrorSubmit("Erro inesperado: " + (e as Error).message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <>
      <div className={`w-full rounded-lg p-2 bg-green-50 border border-green-200 relative`}>
          {!openModal && (
            <MapContainer
                    key={mapKey}
                    center={coordenadas}
                    zoom={zoom}
                    style={{ height: "520px", width: "100%", borderRadius: 15 }}
                    scrollWheelZoom
                    whenReady={(map: L.Map | null) => { return mapRef.current = map; }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {marcadores.map((m, i) => (
                        <Marker key={m.dbId ?? i} position={m.pos}>
                            <Popup>
                                <strong>{m.nome}</strong>
                                <br />
                                {m.descricao.split('\n').map((line, index) => <span key={index}>{line}<br/></span>)}
                                <div className="flex gap-2 mt-2">
                                  <Button size="sm" variant="outline" onClick={() => openEditMarkerModal(m)}>Editar</Button>
                                  <Button size="sm" variant="destructive" onClick={() => deleteMarker(m)}>Excluir</Button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                    <FlyTo pos={coordenadas} zoom={zoom} />
                </MapContainer>
          )}
      </div>
      <Dialog open={openModal} onOpenChange={(o) => { if(!o) resetForm(); setOpenModal(o); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto z-[2000] bg-white">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Endereço do Biodigestor" : "Adicionar Novo Biodigestor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-xs font-medium">CEP</label>
                <Input value={cep} onChange={e => setCep(e.target.value)} placeholder="01001000" maxLength={9} />
              </div>
              <div className="flex items-end">
                <Button type="button" variant="secondary" onClick={lookupCep}>Buscar CEP</Button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">Nome</label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Biodigestor" />
            </div>
            <div>
              <label className="text-xs font-medium">Logradouro</label>
              <Input value={logradouro} onChange={e => setLogradouro(e.target.value)} placeholder="Rua / Estrada" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium">Número</label>
                <Input value={numero} onChange={e => setNumero(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium">Complemento</label>
                <Input value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="Opcional" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium">Bairro</label>
                <Input value={bairro} onChange={e => setBairro(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium">Cidade</label>
                <Input value={cidade} onChange={e => setCidade(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">UF</label>
              <Input value={uf} onChange={e => setUf(e.target.value)} maxLength={2} />
            </div>
            <div className="text-xs text-gray-600">
              Endereço completo: <span className="font-medium">{assembleAddress() || "(incompleto)"}</span>
            </div>
            {errorSubmit && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                {errorSubmit}
                {errorSubmit.includes("logado") && (
                  <a href="/login" className="block mt-2 text-blue-600 underline">
                    Ir para página de login
                  </a>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button variant="outline" type="button" onClick={() => { setOpenModal(false); }}>Cancelar</Button>
            <Button type="button" onClick={submitMarker} disabled={loadingSubmit}>{loadingSubmit ? "Salvando..." : (editingId ? "Salvar Alterações" : "Adicionar")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}