# 📊 BetterStack Logs - Implementação no Backend

## 🎯 Objetivo
Adicionar sistema de logs integrado com BetterStack (Logtail) no backend para rastrear erros, info e eventos importantes.

---

## 📦 **PASSO 1: Instalar dependências**

```bash
npm install winston @logtail/node @logtail/winston
```

---

## 📝 **PASSO 2: Criar arquivo de logger**

Criar arquivo `lib/logger-winston.js` (ou `src/lib/logger-winston.js` dependendo da estrutura):

```javascript
// lib/logger-winston.js
const winston = require('winston');
const { Logtail } = require('@logtail/node');
const { LogtailTransport } = require('@logtail/winston');

// Configuração do Logtail (BetterStack)
const logtail = new Logtail(process.env.LOGTAIL_TOKEN, {
  endpoint: process.env.LOGTAIL_URL,
});

// Criando a instância base com formatação
const baseLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, ...rest }) => {
      const meta = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : '';
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${meta}`;
    })
  ),
  transports: [
    new winston.transports.Console(), // Log no console também
    new LogtailTransport(logtail), // Envia para BetterStack
  ],
});

// Métodos personalizados
const logger = {
  info: (msg, meta) => baseLogger.info(msg, meta),
  warn: (msg, meta) => baseLogger.warn(msg, meta),
  error: (msg, meta) => baseLogger.error(msg, meta),
  debug: (msg, meta) => baseLogger.debug(msg, meta),
};

module.exports = logger;
```

---

## 🔑 **PASSO 3: Adicionar variáveis no `.env`**

No arquivo `.env` ou `.env.local` do backend:

```env
# BetterStack Logs (Logtail)
LOGTAIL_TOKEN=cZZcxPA7ApX4UgaHu4FdBqNj
LOGTAIL_URL=https://s1611462.eu-nbg-2.betterstackdata.com
```

**⚠️ NÃO COMMITAR `.env` com tokens reais!**

---

## 💡 **PASSO 4: Usar nos endpoints/rotas**

### **Exemplo 1 - Em rota de API (Express/Next.js API Route):**

```javascript
const logger = require('./lib/logger-winston');

// Rota de login
app.post('/api/auth/login', async (req, res) => {
  try {
    logger.info('🔐 Tentativa de login', { email: req.body.email });
    
    // Lógica de login...
    
    logger.info('✅ Login bem-sucedido', { email: req.body.email });
    res.json({ success: true });
  } catch (error) {
    logger.error('❌ Erro no login', { erro: error.message });
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});
```

### **Exemplo 2 - Em rota de Stripe:**

```javascript
const logger = require('./lib/logger-winston');

app.post('/api/stripe/checkout-session', async (req, res) => {
  try {
    logger.info('💳 Criando sessão Stripe', { 
      plano: req.body.planId, 
      valor: req.body.amount 
    });
    
    const session = await stripe.checkout.sessions.create({...});
    
    logger.info('✅ Sessão Stripe criada', { sessionId: session.id });
    res.json({ url: session.url });
  } catch (error) {
    logger.error('❌ Erro ao criar sessão Stripe', { erro: error.message });
    res.status(500).json({ error: 'Erro ao processar pagamento' });
  }
});
```

### **Exemplo 3 - Em operação de banco de dados:**

```javascript
const logger = require('./lib/logger-winston');

async function buscarUsuarios() {
  try {
    logger.info('📊 Buscando usuários no banco');
    const users = await db.query('SELECT * FROM usuarios');
    logger.info('✅ Usuários retornados', { total: users.length });
    return users;
  } catch (error) {
    logger.error('❌ Erro ao buscar usuários', { erro: error.message });
    throw error;
  }
}
```

---

## 🎯 **Lugares recomendados para adicionar logs:**

1. ✅ **Autenticação** (login, signup, logout)
2. ✅ **Stripe/Pagamentos** (checkout, webhooks)
3. ✅ **Erros de API** (try/catch em endpoints)
4. ✅ **Operações de banco** (create, update, delete)
5. ✅ **Health checks** (GET /api/health)

---

## 🔍 **Como ver os logs no BetterStack:**

1. Acesse: https://logs.betterstack.com
2. Vá em **Live tail** para ver logs em tempo real
3. Use filtros por `level` (info, error, warn)
4. Busque por mensagens específicas (ex: "login", "Stripe")

---

## ✅ **Checklist final:**

- [ ] Instalar `winston` e `@logtail/winston`
- [ ] Criar `lib/logger-winston.js`
- [ ] Adicionar `LOGTAIL_TOKEN` e `LOGTAIL_URL` no `.env`
- [ ] Importar logger nas rotas principais
- [ ] Adicionar `logger.info()` em operações importantes
- [ ] Adicionar `logger.error()` em blocos catch
- [ ] Testar fazendo login/checkout e ver logs no BetterStack

---

## 🚀 **Pronto!** 

Agora o backend está enviando logs para o BetterStack automaticamente!