"use client"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Mantém sessão no localStorage
    autoRefreshToken: true, // Renova token automaticamente
    detectSessionInUrl: true, // Detecta sessão em callbacks OAuth
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    storageKey: "sb-biodash-auth",
    flowType: "pkce",
  },
})

// Helper para verificar se está autenticado
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

// Helper para fazer logout
export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Erro ao fazer logout:', error)
    throw error
  }
  // Limpa localStorage
  localStorage.removeItem('sb-biodash-auth')
  // Força reload para limpar estado
  window.location.href = '/'
}

