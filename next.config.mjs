/** @type {import('next').NextConfig} */
const nextConfig = {
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
        destination: 'http://localhost:3000/api/:path*', // Envia para o seu back-end
      },
    ]
  },
}


export default nextConfig
