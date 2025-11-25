/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Desabilita StrictMode para evitar dupla renderização do mapa
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuração de rewrites para redirecionar chamadas de API para o back-end
  async rewrites() {
    return [
      {
        source: '/api/:path*', // Captura todas as rotas que começam com /api/
        destination: 'http://localhost:3003/api/:path*', // Envia para o seu back-end
      },
    ]
  },
}

export default nextConfig
