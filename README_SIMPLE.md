BioDash - Guia Rápido (Front + Back)

Este README contém passos simples para rodar o backend e o frontend localmente usando Docker.

Pré-requisitos:
- Docker Desktop instalado e rodando
- Git

INSTRUÇÕES RÁPIDAS (Windows PowerShell / CMD)

1) Backend (subir primeiro)

1. git clone https://github.com/Adejarbas/BioDashBD
2. cd BioDashBD
3. git checkout feature/docker-integration
4. copy .env.example .env.local   (PowerShell/CMD)
5. notepad .env.local             (editar e colar chaves reais)
6. docker-compose up biodash-backend --build

Verificação: curl http://localhost:3003/api/health  (deve retornar {"status":"ok"})

2) Frontend (depois que o backend estiver pronto)

1. git clone https://github.com/Adejarbas/BioDashFront
2. cd BioDashFront
3. git checkout feature/docker-setup
4. copy .env.local .env   (cria .env que o docker-compose usa)
5. docker-compose up biodash-front --build

Abrir no navegador: http://localhost:3001

NOTAS IMPORTANTES
- Se docker-compose reclamar de "depends_on: biodash-backend" rode backend e frontend separadamente.
- Se houver warnings "variable is not set", crie um arquivo .env com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.
- Se houver conflito de rede (biodash-network), remova a rede antiga: docker network rm biodash-network

COMANDOS ÚTEIS
- docker ps
- docker-compose logs -f biodash-backend
- docker-compose logs -f biodash-front
- docker-compose down
- docker-compose build --no-cache
- docker system prune -a --volumes -f   (cuidado: remove volumes e imagens)

DICAS RÁPIDAS
- Garanta que o backend esteja rodando antes de abrir o frontend.
- Para dev com hot-reload, use o serviço biodash-frontend-dev do docker-compose.dev.yml.

Se deseja que eu adicione build args no docker-compose para passar variáveis ao build automaticamente, posso aplicar essa mudança na branch feature/docker-setup.
