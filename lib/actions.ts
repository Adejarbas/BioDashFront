"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Resend } from "resend"

// --- CONFIGURAÇÕES ---
const resend = new Resend(process.env.RESEND_API_KEY)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:3003"
const RESEND_TEST_EMAIL = 'grupobiogen.equipe@gmail.com'

// --- FUNÇÃO AUXILIAR PARA CRIAR O CLIENTE SUPABASE CORRETAMENTE ---
// Isso resolve o erro: "createServerClient was configured without set and remove cookie methods"
function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ocorre quando tentamos setar cookies de um Server Component
            // (pode ser ignorado em Server Actions na maioria dos casos)
          }
        },
      },
    }
  )
}

// ============================================================================
// LOGIN (SIGN IN)
// ============================================================================
export async function signIn(prevState: any, formData: FormData) {
  if (!formData) return { error: "Form data is missing" }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) return { error: "Email and password are required" }

  // Usamos nossa função auxiliar aqui
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) return { error: error.message }

    // Sincronização opcional
    try {
      await fetch(`${API_BASE}/api/auth/session-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toString() }),
      })
    } catch (e) {
      console.warn("session-sync failed:", e)
    }

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// ============================================================================
// CADASTRO (SIGN UP)
// ============================================================================
export async function signUp(prevState: any, formData: FormData) {
  if (!formData) return { error: "Form data is missing" }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) return { error: "Email and password are required" }

  const supabase = createClient()

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"}/dashboard`,
        data: { email_confirm: true },
      },
    })

    if (error) return { error: error.message }

    // Auto-confirmação
    if (data.user && !data.user.email_confirmed_at) {
      const { error: confirmError } = await supabase.auth.admin.updateUserById(data.user.id, { email_confirm: true })
      if (confirmError) console.log("Could not auto-confirm user:", confirmError.message)
    }

    // Criação de dados no Backend
    if (data.user) {
      const userId = data.user.id
      
      const profilePayload = {
        id: userId,
        email: data.user.email,
        company_name: "Empresa Demo",
        address: "Rua das Flores, 123",
        city: "São Paulo",
        state: "SP",
        zip_code: "01234-567",
        phone: "(11) 99999-9999",
        full_name: "Usuário Demo",
      }

      try {
        await fetch(`${API_BASE}/api/user_profiles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profilePayload),
        })
      } catch (e) { console.error("Error creating profile:", e) }

      const biodigesterPayload = [
        {
          user_id: userId,
          energy_generated: 150.5,
          waste_processed: 200.0,
          efficiency: 85.2,
          temperature: 38.5,
          ph_level: 7.2,
          gas_production: 45.8,
        },
        {
          user_id: userId,
          energy_generated: 148.2,
          waste_processed: 195.5,
          efficiency: 83.1,
          temperature: 37.8,
          ph_level: 7.1,
          gas_production: 44.2,
        },
      ]

      try {
        await fetch(`${API_BASE}/api/biodigester-data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(biodigesterPayload),
        })
      } catch (e) { console.error("Error inserting biodigester data:", e) }

      const activitiesPayload = [
        {
          user_id: userId,
          type: "maintenance",
          description: "Sistema de biodigestor iniciado com sucesso",
        },
        {
          user_id: userId,
          type: "alert",
          description: "Temperatura dentro dos parâmetros normais",
        },
      ]

      try {
        await fetch(`${API_BASE}/api/activities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(activitiesPayload),
        })
      } catch (e) { console.error("Error creating activities:", e) }
    }

    return { success: "Conta criada com sucesso! Você já pode fazer login." }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// ============================================================================
// LOGOUT (SIGN OUT)
// ============================================================================
export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  try {
    await fetch(`${API_BASE}/api/auth/signout`, { method: "POST", credentials: "include" })
  } catch (e) { console.warn("backend signout failed:", e) }
  redirect("/login")
}

// ============================================================================
// ENVIO DE ALERTA (MODO TESTE ATIVO)
// ============================================================================
export async function sendAlertEmail(temperatura: number) {
  const supabase = createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ [Actions] Erro: Usuário não autenticado.")
      return { success: false, error: "User not authenticated" }
    }

    const { data: profile, error: dbError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const emailOriginal = profile?.email || "Não encontrado"
    
    // MODO TESTE FORÇADO (PARA EVITAR ERRO 403 DO RESEND)
    console.warn(`⚠️ MODO DE TESTE: Redirecionando envio para ${RESEND_TEST_EMAIL}`)
    
    const { data, error } = await resend.emails.send({
      from: 'Biodigestor <onboarding@resend.dev>',
      to: [RESEND_TEST_EMAIL], 
      subject: `🚨 ALERTA CRÍTICO: Temperatura ${temperatura.toFixed(1)}°C`,
      html: `
        <div style="font-family: sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f3f4f6; padding: 10px; margin-bottom: 20px; border-radius: 6px; font-size: 12px; color: #6b7280;">
            <strong>MODO DE TESTE:</strong> Originalmente para: ${emailOriginal}
          </div>
          <h1 style="color: #dc2626;">⚠️ Alerta de Segurança</h1>
          <p>Temperatura Crítica Detectada:</p>
          <h2 style="font-size: 40px; color: #dc2626;">${temperatura.toFixed(1)}°C</h2>
          <p>Verifique o equipamento imediatamente.</p>
        </div>
      `,
    })

    if (error) {
      console.error("❌ [Actions] Erro Resend:", error)
      return { success: false, error }
    }

    return { success: true, data }

  } catch (error) {
    console.error("❌ [Actions] Erro Inesperado:", error)
    return { success: false, error }
  }
}