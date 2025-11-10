"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// URL base do backend (usa variável de ambiente com fallback)
const API_BASE = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3003"

export async function signIn(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Dados do formulário ausentes" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios" }
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

    // Notifica backend sobre login (opcional)
    try {
      await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.toString() }),
      })
    } catch (e) {
      console.warn("Erro ao sincronizar sessão com backend:", e)
    }

    return { success: true }
  } catch (error) {
    console.error("Erro no login:", error)
    return { error: "Ocorreu um erro inesperado. Tente novamente." }
  }
}

export async function signUp(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Dados do formulário ausentes" }
  }

  const email = formData.get("email")
  const password = formData.get("password")
  const fullName = formData.get("fullName")
  const companyName = formData.get("companyName")

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
        data: {
          full_name: fullName?.toString(),
          company_name: companyName?.toString(),
          email_confirm: true,
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    if (data.user) {
      const userId = data.user.id
      
      // Criar perfil no backend
      try {
        await fetch(`${API_BASE}/api/user_profiles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            id: userId,
            email: email.toString(),
            full_name: fullName?.toString() || "Usuário",
            company_name: companyName?.toString() || "Empresa",
          }),
        })
      } catch (e) {
        console.error("Erro ao criar perfil no backend:", e)
      }
    }

    return { success: "Conta criada com sucesso! Você já pode fazer login." }
  } catch (error) {
    console.error("Erro no cadastro:", error)
    return { error: "Ocorreu um erro inesperado. Tente novamente." }
  }
}

export async function signOut() {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    await supabase.auth.signOut()

    // Notifica backend sobre logout (opcional)
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include"
      })
    } catch (e) {
      console.warn("Erro ao notificar backend sobre logout:", e)
    }

    redirect("/login")
  } catch (error) {
    console.error("Erro ao fazer logout:", error)
    return { error: "Ocorreu um erro ao fazer logout. Tente novamente." }
  }
}

export async function updateProfile(prevState: any, formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: "Usuário não autenticado" }
    }

    const updates = {
      full_name: formData.get("fullName")?.toString(),
      company_name: formData.get("companyName")?.toString(),
      address: formData.get("address")?.toString(),
      city: formData.get("city")?.toString(),
      state: formData.get("state")?.toString(),
      phone: formData.get("phone")?.toString(),
    }

    // Atualiza no backend
    try {
      const res = await fetch(`${API_BASE}/api/user_profiles/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      })

      if (!res.ok) {
        throw new Error("Erro ao atualizar perfil no backend")
      }
    } catch (e) {
      console.error("Erro na atualização do perfil:", e)
      return { error: "Erro ao atualizar perfil. Tente novamente." }
    }

    return { success: "Perfil atualizado com sucesso!" }
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error)
    return { error: "Ocorreu um erro inesperado. Tente novamente." }
  }
}