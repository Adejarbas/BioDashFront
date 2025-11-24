# Configuração de CORS para Backend (Porta 3003)

## Problema Identificado

O erro no console mostra:
```
Access to fetch at 'http://localhost:3003/api/stripe/checkout-session' from origin 'http://localhost:3001' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
The 'Access-Control-Allow-Origin' header has a value 'http://localhost:3001/' that is not equal to the supplied origin.
```

## Causa

O backend (porta 3003) precisa permitir explicitamente:
1. A origem `http://localhost:3001` (sem barra final)
2. Cookies via `Access-Control-Allow-Credentials: true`
3. Headers corretos (`Content-Type`)
4. Método `POST`

## Solução no Backend

### Se estiver usando Express.js

Instale o pacote CORS:
```bash
npm install cors
```

Configure no arquivo principal do servidor (geralmente `server.js` ou `app.js`):

```javascript
const express = require('express');
const cors = require('cors');

const app = express();

// Configuração CORS para permitir frontend (porta 3001)
app.use(cors({
  origin: 'http://localhost:3001', // SEM barra no final
  credentials: true, // Permite envio de cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Resto da configuração...
app.use(express.json());

// Suas rotas Stripe...
app.post('/api/stripe/checkout-session', async (req, res) => {
  // ...código existente
});

app.listen(3003, () => {
  console.log('Backend rodando na porta 3003');
});
```

### Alternativa: Configuração Manual de Headers

Se não quiser usar o pacote `cors`, adicione os headers manualmente antes das suas rotas:

```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3001'); // SEM barra
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Responde diretamente para requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});
```

## Checklist de Verificação

Após aplicar a configuração no backend:

- [ ] Reiniciar o servidor backend (porta 3003)
- [ ] Verificar no console do backend que a porta 3003 está ativa
- [ ] Testar novamente o botão "Assinar" no frontend
- [ ] Confirmar no Network do navegador que:
  - A requisição OPTIONS (preflight) retorna 200
  - A requisição POST retorna 200 ou 303 (redirect)
  - O header `Access-Control-Allow-Origin: http://localhost:3001` está presente

## Produção

Para ambiente de produção, substitua:
```javascript
origin: 'http://localhost:3001'
```

Por:
```javascript
origin: process.env.FRONTEND_URL || 'https://seudominio.com'
```

E configure a variável `FRONTEND_URL` no `.env` do backend.

## Próximos Passos

1. Aplique uma das configurações acima no backend
2. Reinicie o servidor backend
3. Teste o checkout novamente
4. Se o erro persistir, compartilhe o código do backend (arquivo principal) para análise
