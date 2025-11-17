"use client";

// --- Imports do React e Next ---
import Link from "next/link";
import Image from "next/image"; // Importado para o logo
import { useState, useEffect, useMemo } from "react";

// --- Imports de Componentes UI ---
import { Button } from "@/components/ui/button";

// --- Imports de Ícones ---
import { Recycle, LightningCharge, GraphUpArrow } from 'react-bootstrap-icons';


// teste para verificar conexão com o banco \/
// console.log("TESTE SUPABASE URL =>", process.env.NEXT_PUBLIC_SUPABASE_URL)


// --- Tipos ---
type User = {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  company_name?: string;
  razao_social?: string;
  address?: string;
};

type Avaliacao = {
  titulo: string;
  descricao: string;
  estrelas: number;
  usuario: string;
  foto?: string | null;
};

type Plano = {
  id: string; // ID único (ex: 'essencial')
  valor: number; // Valor para o Stripe (em centavos)
  nome: string;
  preco: string; // Valor formatado (ex: 'R$5/mês')
};

// --- Constantes ---
const PLANOS: Plano[] = [
  { id: 'essencial', valor: 500, nome: 'Plano Essencial', preco: 'R$5/mês' },
  { id: 'pro', valor: 1000, nome: 'Plano Profissional', preco: 'R$10/mês' },
  { id: 'premium', valor: 1500, nome: 'Plano Premium', preco: 'R$15/mês' },
];

export default function Home() {
  // --- Estados ---
  const [userData, setUserData] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState("");

  const [loadingPlan, setLoadingPlan] = useState<{[key: string]: boolean}>({});
  const [errorPlan, setErrorPlan] = useState<{[key: string]: string}>({});

  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);

  // --- Lógica de Autenticação ---
  const isAuthenticated = useMemo(() => {
  // Enquanto ainda está carregando, não considerar logado
  if (userLoading) return false;

  // Se não tem usuário retornado pela API, não está logado
  if (!userData || !userData.email) return false;

  return true;
}, [userData, userLoading]);

  // --- Effects ---
  
  // Buscar dados do usuário autenticado
  useEffect(() => {
    setUserLoading(true);
    fetch("/api/user")
      .then(async (res) => {
        const data = await res.json();

        if (res.ok && data.success) {
          // 1. SUCESSO: Usuário está logado
          setUserData(data.user);
          setUserError(""); 
        } 
        else {
          // 2. FALHA (qualquer tipo): Pode ser 401, 500, ou 200 com success:false
          const errorMessage = data.message || "Erro desconhecido ao buscar usuário";

          // 3. VERIFICAR se a falha é um "Não logado" esperado
          //    Verificamos o status 401 OU a mensagem "unauthorized"
          if (res.status === 401 || errorMessage.toLowerCase().includes('unauthorized')) {
            // É um "não logado" esperado. NÃO mostrar erro.
            setUserError("");
          } 
          else {
            // É um erro REAL (ex: 500, "database connection failed", etc)
            // SÓ AGORA definimos o erro
            setUserError(errorMessage);
          }
        }
      })
      .catch((err) => {
        // 4. ERRO DE REDE teste para verificar conexão com o banco \/
        //console.error("Erro de conexão ao buscar usuário:", err);
        //setUserError("Erro de conexão ao buscar usuário");
      })
      .finally(() => setUserLoading(false));
  }, []);

  // Carregar avaliações do localStorage
  useEffect(() => {
    const stored = localStorage.getItem("avaliacoes");
    if (stored) {
      setAvaliacoes(JSON.parse(stored));
    }
  }, []);

  // --- Handlers ---
  const handleCheckoutPlano = async (plano: Plano) => {
    setLoadingPlan((prev) => ({ ...prev, [plano.id]: true }));
    setErrorPlan((prev) => ({ ...prev, [plano.id]: "" }));
    try {
      const res = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: plano.valor, planId: plano.id })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorPlan((prev) => ({ ...prev, [plano.id]: data.error || "Erro ao criar checkout" }));
      }
    } catch (err) {
      setErrorPlan((prev) => ({ ...prev, [plano.id]: "Erro de conexão com o servidor" }));
    } finally {
      setLoadingPlan((prev) => ({ ...prev, [plano.id]: false }));
    }
  };

  // --- Renderização ---
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      {/* === HEADER (CABEÇALHO) === */}
      <header className="sticky top-0 z-50 px-6 py-4 border-b bg-white/90 backdrop-blur-sm">
        <div className="container flex items-center justify-between">
          
          {/* Logo com link para a home */}
          <Link href="/">
            <Image
              src="/logo-biogen.png" 
              alt="Logo BioGen"
              width={140} // Ajuste a LARGURA conforme necessário
              height={40} // Ajuste a ALTURA conforme necessário
              priority 
            />
          </Link>

          <nav className="flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <Link href="/login">
                  <Button variant="outline">Entrar</Button>
                </Link>
                <Link href="/register">
                  <Button>Registrar</Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard">
                <Button>Meu Perfil</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>
      
      {/* === MAIN (CONTEÚDO) === */}
      <main className="flex-1">
        
        {/* Exibir erro de usuário (apenas erros reais) */}
        {userError && (
          <section className="container my-6">
            <div className="bg-red-100 border border-red-300 text-red-800 rounded p-4 text-center">
              {userError}
            </div>
          </section>
        )}

        {/* Exibe mensagem de boas-vindas se logado */}
        {!userLoading && isAuthenticated && (
          <section className="container my-6">
            <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
              <div className="text-green-800 text-lg font-semibold mb-2">
                Seja bem-vindo, {userData?.name || userData?.full_name || userData?.email}!
              </div>
              <div><b>ID:</b> {userData?.id}</div>
              <div><b>Email:</b> {userData?.email}</div>
              <div><b>Nome:</b> {userData?.name || userData?.full_name || "-"}</div>
              <div><b>Empresa (Razão Social):</b> {userData?.company_name || userData?.razao_social || "-"}</div>
              <div><b>Endereço:</b> {userData?.address || "-"}</div>
            </div>
          </section>
        )}
        
        {/* === HERO BANNER === */}
        {/* TODO: Substitua a URL da imagem de fundo abaixo */}
        <section 
          id="home" 
          className="relative py-32 md:py-48 text-white bg-cover bg-center bg-[url('../public/bidigester-bg.jpg')]">
          {/* Overlay escuro */}
          <div className="absolute inset-0 bg-black/60" />
          
          <div className="relative z-10 container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Sistema de Gestão de Biodigestores
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-200 md:text-xl">
                  Monitore e otimize o desempenho do seu biodigestor com nosso dashboard completo e intuitivo.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="#planos">
                  <Button size="lg">Ver Planos</Button>
                </Link>
                <Link href="#funcionalidades">
                  <Button variant="outline" size="lg" className="text-black border-white hover:bg-black hover:text-white">
                    Saiba Mais
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* === SEÇÃO DE PLANOS === */}
        <section id="planos" className="py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold text-center mb-8">Escolha seu plano de assinatura</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {PLANOS.map((plano) => (
                <div 
                  key={plano.id} 
                  className="border rounded-lg p-6 flex flex-col items-center shadow-lg transition-transform duration-300 hover:scale-105"
                >
                  <h3 className="text-xl font-bold mb-2">{plano.nome}</h3>
                  <p className="text-2xl font-semibold mb-4">{plano.preco}</p>
                  <ul className="mb-6 text-gray-600 text-center">
                    <li>Gestão completa de biodigestores</li>
                    <li>Dashboard de indicadores</li>
                    <li>Suporte dedicado</li>
                  </ul>
                  <Button size="lg" onClick={() => handleCheckoutPlano(plano)} disabled={!!loadingPlan[plano.id]}>
                    {loadingPlan[plano.id] ? "Redirecionando..." : `Assinar por ${plano.preco}`}
                  </Button>
                  {errorPlan[plano.id] && (
                    <div className="text-red-500 text-sm mt-2">{errorPlan[plano.id]}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === SEÇÃO DE AVALIAÇÕES === */}
        <section id="avaliacoes" className="py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="max-w-7xl mx-auto p-12 bg-white rounded shadow-lg border-t-4 border-green-400">
              <h2 className="text-3xl font-bold mb-8 text-green-700 text-center">Avaliações dos Usuários</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                {avaliacoes.length > 0 ? (
                  avaliacoes.map((av, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-10 min-h-[320px] min-w-[220px] flex flex-col items-center justify-start bg-gray-50 shadow-md">
                      <div className="flex justify-center items-center w-24 h-24 rounded-full bg-green-100 border-2 border-green-300 mb-4">
                        {av.foto ? (
                          <img src={av.foto} alt={av.usuario} className="w-20 h-20 rounded-full object-cover" />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            <span className="text-2xl">👤</span>
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-green-800 mb-2 text-center">{av.usuario}</span>
                      <span className="flex mb-2">
                        {[1,2,3,4,5].map(star => (
                          <span key={star} className={star <= av.estrelas ? "text-yellow-400 text-xl" : "text-gray-300 text-xl"}>★</span>
                        ))}
                      </span>
                      <div className="font-bold mb-2 whitespace-nowrap">{av.titulo}</div>
                      <div className="text-gray-700 text-center">{av.descricao}</div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 text-center text-gray-400 text-lg">Nenhuma avaliação cadastrada ainda.</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* === SEÇÃO DE FUNCIONALIDADES (com ícones Bootstrap) === */}
        <section id="funcionalidades" className="py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Nossos Diferenciais</h2>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              
              {/* 1. Rastreamento de Resíduos */}
              <div className="flex flex-col items-center space-y-2 text-center">
                <div className="p-4 bg-green-100 rounded-full">
                  <Recycle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold">Rastreamento de Resíduos</h3>
                <p className="text-gray-500">Monitore a quantidade de resíduos processados pelo seu biodigestor em tempo real.</p>
              </div>

              {/* 2. Geração de Energia */}
              <div className="flex flex-col items-center space-y-2 text-center">
                <div className="p-4 bg-yellow-100 rounded-full">
                  <LightningCharge className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold">Geração de Energia</h3>
                <p className="text-gray-500">Acompanhe a energia produzida pelo seu sistema com análises detalhadas.</p>
              </div>

              {/* 3. Benefícios Fiscais */}
              <div className="flex flex-col items-center space-y-2 text-center">
                <div className="p-4 bg-blue-100 rounded-full">
                  <GraphUpArrow className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Benefícios Fiscais</h3>
                <p className="text-gray-500">Calcule e visualize os benefícios fiscais da sua produção de energia sustentável.</p>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* === FOOTER (RODAPÉ) === */}
      <footer className="py-8 border-t bg-gray-100">
        <div className="container flex flex-col items-center justify-center gap-4 text-center md:flex-row md:gap-8">
          <p className="text-sm text-gray-500">© 2024 BioDash. Todos os direitos reservados.</p>
          <nav className="flex gap-4 text-sm">
            <Link href="#" className="text-gray-500 hover:underline">
              Termos
            </Link>
            <Link href="#" className="text-gray-500 hover:underline">
              Privacidade
            </Link>
            <Link href="#" className="text-gray-500 hover:underline">
              Contato
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )};