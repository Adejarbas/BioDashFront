export function getApiBaseUrlServer() {
  return process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
}

export function getApiBaseUrlClient() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "/"
}