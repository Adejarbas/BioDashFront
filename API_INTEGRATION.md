# Especificação de Integração Frontend-Backend

Este documento descreve como o frontend faz requisições ao backend e quais respostas são esperadas.

## Configuração

O frontend está configurado para fazer requisições ao backend através da variável de ambiente `NEXT_PUBLIC_API_BASE_URL` (padrão: `http://localhost:3003`).

## Formato de Respostas do Backend

Todas as respostas do backend devem seguir o formato padronizado abaixo:

### Resposta de Sucesso

```json
{
  "success": true,
  "message": "Mensagem opcional de sucesso",
  "data": {
    // Dados da resposta
  }
}
```

### Resposta de Erro

```json
{
  "success": false,
  "message": "Mensagem de erro geral",
  "fieldErrors": {
    "campo1": "Erro específico do campo1",
    "campo2": "Erro específico do campo2"
  }
}
```

## Endpoints Esperados

### 1. POST `/api/auth/login`

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "user": {
    "id": "uuid-do-usuario",
    "email": "usuario@example.com",
    "full_name": "Nome Completo",
    "company_name": "Nome da Empresa"
  }
}
```

**Resposta de Erro (401/400):**
```json
{
  "success": false,
  "message": "Credenciais inválidas",
  "fieldErrors": {
    "email": "Email não encontrado",
    "password": "Senha incorreta"
  }
}
```

**Comportamento do Frontend:**
- Se `success: true` e `user` presente → Redireciona para `/dashboard`
- Se `success: false` → Exibe mensagem de erro e erros de campo específicos

---

### 2. POST `/api/auth/signup`

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "senha123",
  "razao_social": "Razão Social da Empresa",
  "cnpj": "12345678000190",
  "cep": "12345678",
  "numero": "123",
  "address": "Rua, Bairro, Cidade - UF"
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "message": "Conta criada com sucesso!",
  "user": {
    "id": "uuid-do-usuario",
    "email": "usuario@example.com"
  }
}
```

**Resposta de Erro (400/409):**
```json
{
  "success": false,
  "message": "Erro ao criar conta",
  "fieldErrors": {
    "email": "Email já está em uso",
    "cnpj": "CNPJ inválido",
    "password": "Senha muito fraca"
  }
}
```

**Comportamento do Frontend:**
- Se `success: true` → Exibe mensagem de sucesso e redireciona para `/login` após 2 segundos
- Se `success: false` → Exibe mensagem de erro e erros de campo específicos

---

### 3. POST `/api/auth/logout`

**Request:** Sem body necessário

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

**Comportamento do Frontend:**
- Sempre redireciona para `/login` após a requisição (mesmo se o backend falhar)

---

### 4. GET `/api/user`

**Request:** Sem body necessário (usa cookies de sessão)

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-do-usuario",
    "email": "usuario@example.com",
    "full_name": "Nome Completo",
    "company_name": "Nome da Empresa",
    "address": "Endereço completo",
    "phone": "Telefone"
  }
}
```

**Resposta de Erro (401):**
```json
{
  "success": false,
  "message": "Usuário não autenticado"
}
```

**Comportamento do Frontend:**
- Se `success: false` ou `auth: false` → Redireciona para `/login`
- Usado para verificar autenticação em páginas protegidas

---

### 5. PUT `/api/user_profiles/:userId`

**Request Body:**
```json
{
  "full_name": "Nome Completo",
  "company_name": "Nome da Empresa",
  "address": "Endereço completo",
  "city": "Cidade",
  "state": "Estado",
  "phone": "Telefone"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Perfil atualizado com sucesso",
  "data": {
    // Dados atualizados do perfil
  }
}
```

**Resposta de Erro (400/401):**
```json
{
  "success": false,
  "message": "Erro ao atualizar perfil",
  "fieldErrors": {
    "phone": "Telefone inválido"
  }
}
```

---

## Validações no Frontend

O frontend já realiza algumas validações básicas antes de enviar para o backend:

### Login
- Email e senha obrigatórios
- Formato de email válido

### Registro
- Email e senha obrigatórios
- Formato de email válido
- Senha com mínimo de 6 caracteres
- CNPJ com 14 dígitos (após remover formatação)
- CEP com 8 dígitos (após remover formatação)

## Cookies de Sessão

O frontend usa `credentials: "include"` em todas as requisições para enviar cookies de sessão. O backend deve:
- Configurar cookies HTTP-only para sessões
- Validar cookies em requisições autenticadas
- Retornar 401 quando a sessão for inválida/expirada

## Tratamento de Erros

O frontend trata os seguintes tipos de erro:

1. **Erros de Validação (400)**: Exibe mensagem geral e erros de campo específicos
2. **Erros de Autenticação (401)**: Redireciona para `/login`
3. **Erros de Rede**: Exibe mensagem de erro de conexão
4. **Erros do Servidor (500)**: Exibe mensagem genérica de erro

## Exemplo de Implementação no Backend

```javascript
// Exemplo de endpoint de login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validações
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email e senha são obrigatórios",
        fieldErrors: {
          email: !email ? "Email é obrigatório" : undefined,
          password: !password ? "Senha é obrigatória" : undefined
        }
      });
    }

    // Autenticação
    const user = await authenticateUser(email, password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Credenciais inválidas",
        fieldErrors: {}
      });
    }

    // Configurar sessão/cookie
    req.session.userId = user.id;
    res.cookie('session', sessionToken, { httpOnly: true, secure: true });

    // Resposta de sucesso
    return res.status(200).json({
      success: true,
      message: "Login realizado com sucesso",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        company_name: user.company_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      fieldErrors: {}
    });
  }
});
```

## Notas Importantes

1. **CORS**: O backend deve permitir requisições do frontend (origem e credentials)
2. **Cookies**: Use cookies HTTP-only para segurança
3. **Status Codes**: Use códigos HTTP apropriados (200, 201, 400, 401, 500)
4. **Consistência**: Sempre retorne o formato padronizado de resposta
5. **Mensagens**: Forneça mensagens de erro claras e em português

