export function getApiBaseUrlServer() {
  // Prioriza uma variável server-side/API_BASE_URL, depois a variável pública NEXT_PUBLIC_API_BASE_URL
  // e por fim faz fallback para o backend local na porta 3003.
  return process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3003"
}

export function getApiBaseUrlClient() {
  // Para chamadas do cliente, priorizamos a variável pública que aponta para o backend local
  // (útil quando o backend está separado e roda em http://localhost:3003). Em falta, usa o
  // backend local como fallback explícito.
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3003"
}

// ----------------------------------------------------------------------
// API Client - Utilitário para fazer requisições ao backend
// ----------------------------------------------------------------------

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  fieldErrors?: Record<string, string>
}

export interface ApiError {
  message: string
  fieldErrors?: Record<string, string>
  status?: number
}

/**
 * Faz uma requisição ao backend com tratamento de erros padronizado
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const API_BASE = typeof window === 'undefined' 
    ? getApiBaseUrlServer() 
    : getApiBaseUrlClient();

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Importante para cookies de sessão
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.message || `Erro ${res.status}: ${res.statusText}`,
        fieldErrors: data.fieldErrors || {},
        data: data.data,
      };
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  } catch (err: any) {
    console.error(`API Request Error [${endpoint}]:`, err);
    
    if (err.message?.includes('fetch') || err.message?.includes('network')) {
      return {
        success: false,
        error: 'Erro de conexão. Verifique se o backend está rodando.',
        fieldErrors: {},
      };
    }

    return {
      success: false,
      error: err.message || 'Erro inesperado ao fazer requisição.',
      fieldErrors: {},
    };
  }
}

/**
 * Verifica se o usuário está autenticado
 */
export async function checkAuth(): Promise<ApiResponse<{ user: any }>> {
  return apiRequest<{ user: any }>('/api/user');
}

// ----------------------------------------------------------------------
// API Fetch - Utilitário para fazer requisições ao backend
// ----------------------------------------------------------------------

export async function apiFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(path, { // path relativo, ex: "/api/auth/login"
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  
  return res;
}