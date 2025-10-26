// ...existing code...
"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// Base URL do backend (usa variável de ambiente; fallback para localhost:3000)
const API_BASE = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"

// ...existing code...
export async function signIn(prevState: any, formData: FormData) {
  // Check if formData is valid
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  // Validate required fields
  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    // Se precisar notificar o backend sobre login/session, chame aqui (opcional)
    try {
      await fetch(`${API_BASE}/api/auth/session-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toString() }),
      })
    } catch (e) {
      // Não falha o login por conta dessa chamada; apenas log
      console.warn("session-sync failed:", e)
    }

    // Return success instead of redirecting directly
    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
// ...existing code...
export async function signUp(prevState: any, formData: FormData) {
  // Check if formData is valid
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  // Validate required fields
  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
        data: {
          email_confirm: true,
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    if (data.user && !data.user.email_confirmed_at) {
      // Try to confirm the user programmatically
      const { error: confirmError } = await supabase.auth.admin.updateUserById(data.user.id, { email_confirm: true })

      if (confirmError) {
        console.log("Could not auto-confirm user:", confirmError.message)
      }
    }

    // Se houver usuário, crie dados no backend em vez de usar direto o supabase.from(...)
    if (data.user) {
      const userId = data.user.id
      // Profile payload
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
        // Ajuste a rota abaixo para a rota real do seu backend
        await fetch(`${API_BASE}/api/user_profiles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profilePayload),
        })
      } catch (e) {
        console.error("Error creating profile on backend:", e)
      }

      // Biodigester data
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
      } catch (e) {
        console.error("Error inserting biodigester data on backend:", e)
      }

      // Activities
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
      } catch (e) {
        console.error("Error creating activities on backend:", e)
      }
    }

    return { success: "Conta criada com sucesso! Você já pode fazer login." }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
// ...existing code...
export async function signOut() {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  await supabase.auth.signOut()

  // Notifica backend (opcional) para limpar sessão server-side se necessário
  try {
    await fetch(`${API_BASE}/api/auth/signout`, { method: "POST", credentials: "include" })
  } catch (e) {
    console.warn("backend signout failed:", e)
  }

  redirect("/login")
}
// ...existing code...