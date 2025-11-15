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
    // Em Docker, usa o nome do container; localmente usa localhost
    const isDocker = process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true'
    const backendUrl = isDocker ? 'http://biodash-backend:3003' : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3003')
    
    return [
      {
        source: '/api/:path*', // Captura todas as rotas que começam com /api/
        destination: `${backendUrl}/api/:path*`, // Envia para o seu back-end
      },
    ]
  },
}


export default nextConfig
