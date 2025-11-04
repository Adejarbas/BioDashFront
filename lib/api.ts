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