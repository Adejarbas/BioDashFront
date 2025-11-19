"use server"

import { redirect } from "next/navigation";
import { getApiBaseUrlServer } from "./api";

// ----------------------------------------------------------------------
// SIGN IN  (Frontend → Backend)
// ----------------------------------------------------------------------
export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  // Validação básica no frontend
  if (!email || !password) {
    return { 
      success: false,
      error: "Email e senha são obrigatórios.",
      fieldErrors: {}
    };
  }

  // Validação de formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { 
      success: false,
      error: "Por favor, insira um email válido.",
      fieldErrors: { email: "Email inválido" }
    };
  }

  const API_BASE = getApiBaseUrlServer();
  
  // Log para debug
  if (process.env.NODE_ENV === 'development') {
    console.log('[LOGIN] Fazendo requisição para:', `${API_BASE}/api/auth/login`);
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    // Log para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('[LOGIN] Status:', res.status);
      console.log('[LOGIN] Headers:', Object.fromEntries(res.headers.entries()));
    }

    let data: any;
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('[LOGIN] Erro ao fazer parse da resposta:', parseError);
      return {
        success: false,
        error: "Resposta inválida do servidor.",
        fieldErrors: {}
      };
    }

    // Log da resposta para debug
    if (process.env.NODE_ENV === 'development') {
      console.log('[LOGIN] Resposta do backend:', JSON.stringify(data, null, 2));
    }

    // Backend retornou erro de validação
    if (!res.ok) {
      // Se o backend retornou erros de campo específicos
      if (data.fieldErrors && typeof data.fieldErrors === 'object') {
        return {
          success: false,
          error: data.message || "Erro ao fazer login",
          fieldErrors: data.fieldErrors
        };
      }

      // Erro geral do backend
      return {
        success: false,
        error: data.message || "Falha ao fazer login. Verifique suas credenciais.",
        fieldErrors: {}
      };
    }

    // Login bem-sucedido - aceita diferentes formatos de resposta
    // Formato 1: { success: true, user: {...} }
    // Formato 2: { success: true, data: { user: {...} } }
    // Formato 3: { user: {...} } (sem campo success)
    // Formato 4: Status 200/201/204 sem body (apenas cookie de sessão)
    
    const hasUser = data.user || (data.data && data.data.user);
    const isSuccess = data.success !== false; // Considera sucesso se não for explicitamente false
    const isSuccessStatus = res.status === 200 || res.status === 201 || res.status === 204;
    
    // Se o status indica sucesso (200/201/204), redireciona para dashboard
    // Isso funciona mesmo se o backend só configurou cookies de sessão sem retornar dados
    if (isSuccessStatus && isSuccess) {
      redirect("/dashboard");
    }

    // Se tem user na resposta, também redireciona (mesmo que o status seja diferente)
    if (hasUser && isSuccess) {
      redirect("/dashboard");
    }

    // Resposta inesperada - log detalhado para debug
    console.error('[LOGIN] Resposta inesperada:', {
      status: res.status,
      data: data,
      hasUser: hasUser,
      isSuccess: isSuccess
    });

    return {
      success: false,
      error: data.message || "Resposta inesperada do servidor. Verifique os logs do console.",
      fieldErrors: {}
    };
  } catch (err: any) {
    console.error("LOGIN ERROR:", err);
    
    // Erro de rede/conexão
    if (err.message?.includes('fetch') || err.message?.includes('network') || err.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: "Erro de conexão. Verifique se o backend está rodando em " + API_BASE,
        fieldErrors: {}
      };
    }

    // Se o erro for um redirect (Next.js), deixa passar
    if (err.message?.includes('NEXT_REDIRECT')) {
      throw err;
    }

    return {
      success: false,
      error: "Erro inesperado ao fazer login. Tente novamente.",
      fieldErrors: {}
    };
  }
}

// ----------------------------------------------------------------------
// SIGN UP (Frontend → Backend)
// ----------------------------------------------------------------------
export async function signUp(prevState: any, formData: FormData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const razao_social = formData.get("razao_social")?.toString().trim();
  const cnpj = formData.get("cnpj")?.toString().replace(/\D/g, ""); // Remove formatação
  const cep = formData.get("cep")?.toString().replace(/\D/g, ""); // Remove formatação
  const numero = formData.get("numero")?.toString().trim();
  const address = formData.get("address")?.toString().trim();

  // Validação básica
  if (!email || !password) {
    return {
      success: false,
      error: "Email e senha são obrigatórios.",
      fieldErrors: {}
    };
  }

  // Validação de formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: "Por favor, insira um email válido.",
      fieldErrors: { email: "Email inválido" }
    };
  }

  // Validação de senha (mínimo 6 caracteres)
  if (password.length < 6) {
    return {
      success: false,
      error: "A senha deve ter pelo menos 6 caracteres.",
      fieldErrors: { password: "Senha muito curta" }
    };
  }

  // Validação de CNPJ (14 dígitos)
  if (cnpj && cnpj.length !== 14) {
    return {
      success: false,
      error: "CNPJ inválido. Deve conter 14 dígitos.",
      fieldErrors: { cnpj: "CNPJ inválido" }
    };
  }

  // Validação de CEP (8 dígitos)
  if (cep && cep.length !== 8) {
    return {
      success: false,
      error: "CEP inválido. Deve conter 8 dígitos.",
      fieldErrors: { cep: "CEP inválido" }
    };
  }

  const payload = {
    email,
    password,
    razao_social: razao_social || "",
    cnpj: cnpj || "",
    cep: cep || "",
    numero: numero || "",
    address: address || "",
  };

  const API_BASE = getApiBaseUrlServer();

  try {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    // Backend retornou erro de validação
    if (!res.ok) {
      // Se o backend retornou erros de campo específicos
      if (data.fieldErrors && typeof data.fieldErrors === 'object') {
        return {
          success: false,
          error: data.message || "Erro ao criar conta",
          fieldErrors: data.fieldErrors
        };
      }

      // Erro geral do backend
      return {
        success: false,
        error: data.message || "Falha ao criar conta. Verifique os dados informados.",
        fieldErrors: {}
      };
    }

    // Registro bem-sucedido
    if (data.success) {
      return {
        success: true,
        message: data.message || "Conta criada com sucesso! Redirecionando para login...",
        fieldErrors: {}
      };
    }

    // Resposta inesperada
    return {
      success: false,
      error: "Resposta inesperada do servidor.",
      fieldErrors: {}
    };
  } catch (err: any) {
    console.error("SIGNUP ERROR:", err);
    
    // Erro de rede/conexão
    if (err.message?.includes('fetch') || err.message?.includes('network')) {
      return {
        success: false,
        error: "Erro de conexão. Verifique se o backend está rodando.",
        fieldErrors: {}
      };
    }

    return {
      success: false,
      error: "Erro inesperado ao criar conta. Tente novamente.",
      fieldErrors: {}
    };
  }
}

// ----------------------------------------------------------------------
// SIGN OUT (Frontend → Backend)
// ----------------------------------------------------------------------
export async function signOut() {
  const API_BASE = getApiBaseUrlServer();
  
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (e) {
    console.warn("logout backend falhou:", e);
    // Continua com o logout mesmo se o backend falhar
  }

  redirect("/login");
}

// ----------------------------------------------------------------------
// UPDATE PROFILE (Frontend → Backend)
// ----------------------------------------------------------------------
export async function updateProfile(prevState: any, formData: FormData) {
  const userId = formData.get("userId")?.toString();

  if (!userId) {
    return {
      success: false,
      error: "Usuário inválido.",
      fieldErrors: {}
    };
  }

  const updates = {
    full_name: formData.get("fullName")?.toString().trim(),
    company_name: formData.get("companyName")?.toString().trim(),
    address: formData.get("address")?.toString().trim(),
    city: formData.get("city")?.toString().trim(),
    state: formData.get("state")?.toString().trim(),
    phone: formData.get("phone")?.toString().trim(),
  };

  const API_BASE = getApiBaseUrlServer();

  try {
    const res = await fetch(`${API_BASE}/api/user_profiles/${userId}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(updates),
    });

    const data = await res.json();

    if (!res.ok) {
      // Se o backend retornou erros de campo específicos
      if (data.fieldErrors && typeof data.fieldErrors === 'object') {
        return {
          success: false,
          error: data.message || "Erro ao atualizar perfil",
          fieldErrors: data.fieldErrors
        };
      }

      return {
        success: false,
        error: data.message || "Erro ao atualizar perfil.",
        fieldErrors: {}
      };
    }

    return {
      success: true,
      message: data.message || "Perfil atualizado com sucesso!",
      fieldErrors: {}
    };
  } catch (err: any) {
    console.error("UPDATE PROFILE ERROR:", err);
    
    if (err.message?.includes('fetch') || err.message?.includes('network')) {
      return {
        success: false,
        error: "Erro de conexão. Verifique se o backend está rodando.",
        fieldErrors: {}
      };
    }

    return {
      success: false,
      error: "Erro inesperado ao atualizar o perfil.",
      fieldErrors: {}
    };
  }
}
