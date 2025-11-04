# BioDashFront - Setup local

Este repositório contém o frontend (Next.js) da aplicação BioDash. Este README descreve como configurar o ambiente de desenvolvimento local apontando o backend local na porta 3003.

Pré-requisitos
- Node.js (recomendado >= 18)
- pnpm (ou npm/yarn caso prefira)

1) Instalar dependências

Abra um terminal na raiz do projeto e execute:

```powershell
cd 'C:\Users\Alunos\Documents\GitHub\BioDashFront'
pnpm install
```

2) Variáveis de ambiente

Copie o arquivo de exemplo e preencha os valores reais:

```powershell
copy .env.local.example .env.local
```

Edite `.env.local` e preencha:
- `NEXT_PUBLIC_SUPABASE_URL` com a URL do seu projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` com a anon key do Supabase
- `NEXT_PUBLIC_API_BASE_URL` deve apontar para o backend local: `http://localhost:3003`

Observações de segurança
- Não coloque a `SUPABASE_SERVICE_ROLE_KEY` em `.env.local` do frontend. Essa chave é sensível e deve ficar apenas no backend (arquivo `.env` do backend ou variáveis do container/host).

3) Rodar o projeto

```powershell
pnpm dev
```

4) Backend local

Se o seu backend estiver rodando localmente, garanta que ele esteja acessível em `http://localhost:3003`. O frontend foi configurado para usar `NEXT_PUBLIC_API_BASE_URL=http://localhost:3003` por padrão (veja `./.env.local.example`).

5) Testes rápidos

- Acesse a rota de login e tente autenticar; se aparecer erro sobre variáveis do Supabase, verifique o conteúdo de `.env.local`.
- Se precisar de operações administrativas (criar usuários, atualizar RLS), execute essas ações no backend usando `SUPABASE_SERVICE_ROLE_KEY` (no backend somente).

Arquivos úteis
- `.env.local.example` — exemplo de variáveis de ambiente (frontend)
- `lib/actions.ts` — ações de login/signup/signout (já prioriza `NEXT_PUBLIC_API_BASE_URL`)
- `lib/api.ts` — funções utilitárias para obter a base da API (client/server)

Se quiser, eu também posso adicionar um comando `pnpm start` containerizado ou um small script para verificar saúde do backend automaticamente.
# projeto-biogen-v2-react
.
# Faculdade