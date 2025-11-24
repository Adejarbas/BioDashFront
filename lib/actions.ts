"use server"

import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// URL base do backend (lê do .env.local com fallback para a porta 3003)
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3003").replace(/\/+$/, "")

// --- Helper para criar o cliente Supabase ---
const createSupabaseClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore).get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            (await cookieStore).set({ name, value, ...options })
          } catch (error) {
            // Ignora erros em Server Actions
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            (await cookieStore).set({ name, value: "", ...options })
          } catch (error) {
            // Ignora erros em Server Actions
          }
        },
      },
    }
  )
}


// --- Actions de Autenticação ---

export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios." }
  }

  const supabase = createSupabaseClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: String(email),
      password: String(password),
    })

    if (error) {
      return { error: error.message }
    }

    // Bloco de session-sync REMOVIDO para evitar erro 404

    return { success: true }
  } catch (err) {
    console.error("Erro inesperado no login:", err)
    return { error: "Ocorreu um erro inesperado. Tente novamente." }
  }
}

export async function signUp(prevState: any, formData: FormData) {
  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios." }
  }

  const supabase = createSupabaseClient()

  try {
    const { data, error } = await supabase.auth.signUp({
      email: String(email),
      password: String(password),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"}/dashboard`,
      },
    })

    if (error) {
      return { error: error.message }
    }

    // Bloco de user_profiles REMOVIDO para evitar erro 404

    return { success: "Conta criada com sucesso! Verifique seu email para confirmar." }
  } catch (err) {
    console.error("Erro inesperado no cadastro:", err)
    return { error: "Ocorreu um erro inesperado. Tente novamente." }
  }
}

export async function signOut() {
  const supabase = createSupabaseClient()
  await supabase.auth.signOut()
  
  redirect("/login")
}