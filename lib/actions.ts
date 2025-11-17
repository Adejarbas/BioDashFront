"use server"

import { redirect } from "next/navigation"

const API = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3003").replace(/\/+$/, "");

// ----------------------------------------------------------------------
// SIGN IN  (Frontend → Backend / 3003)
// ----------------------------------------------------------------------
export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios." }
  }
 console.log("LOGIN FETCH URL:", `${API}/api/auth/login`);
  try {
    const res = await fetch(`${API}/app/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { error: data.message || "Falha ao fazer login" }
    }

    return { success: true }
  } catch (err) {
    console.error("LOGIN ERROR:", err)
    return { error: "Erro inesperado ao fazer login." }
  }
}

// ----------------------------------------------------------------------
// SIGN UP (Frontend → Backend / 3003)
// ----------------------------------------------------------------------
export async function signUp(prevState: any, formData: FormData) {
  const payload = {
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("fullName"),
    company_name: formData.get("companyName")
  }

  if (!payload.email || !payload.password) {
    return { error: "Email e senha são obrigatórios." }
  }

  try {
    const res = await fetch(`${API}/app/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      return { error: data.message || "Falha ao criar conta" }
    }

    return { success: "Conta criada com sucesso! Faça login." }
  } catch (err) {
    console.error("SIGNUP ERROR:", err)
    return { error: "Erro inesperado ao criar conta." }
  }
}

// ----------------------------------------------------------------------
// SIGN OUT (Frontend → Backend / 3003)
// ----------------------------------------------------------------------
export async function signOut() {
  try {
    await fetch(`${API}/app/api/auth/login`, {
      method: "POST",
      credentials: "include",
    })
  } catch (e) {
    console.warn("logout backend falhou:", e)
  }

  redirect("/login")
}

// ----------------------------------------------------------------------
// UPDATE PROFILE (Frontend → Backend / 3003)
// ----------------------------------------------------------------------
export async function updateProfile(prevState: any, formData: FormData) {
  const userId = formData.get("userId") // você decide de onde vem (session, etc.)

  if (!userId) return { error: "Usuário inválido." }

  const updates = {
    full_name: formData.get("fullName"),
    company_name: formData.get("companyName"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    phone: formData.get("phone"),
  }

  try {
    const res = await fetch(`${API}/user_profiles/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updates),
    })

    if (!res.ok) {
      return { error: "Erro ao atualizar perfil." }
    }

    return { success: "Perfil atualizado com sucesso!" }
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err)
    return { error: "Erro inesperado ao atualizar o perfil." }
  }
}
