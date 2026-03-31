# White Label + Custom Domains API

Documentação completa da API de white label e domínios customizados.

---

## 📋 Índice

1. [White Label Settings](#white-label-settings)
2. [Custom Domains](#custom-domains)
3. [Public API](#public-api)
4. [Limites por Plano](#limites-por-plano)
5. [Fluxo de Setup](#fluxo-de-setup)

---

## 🎨 White Label Settings

### GET `/api/v1/tenant/white-label`

Buscar configurações de white label do tenant.

**Auth:** Expert only

**Response:**
```json
{
  "data": {
    "id": "wl_abc123",
    "tenant_id": "tn_xyz",
    "logo_url": "https://r2.wazefit.com/white-label/tn_xyz/logo.png",
    "logo_small_url": null,
    "favicon_url": "https://r2.wazefit.com/white-label/tn_xyz/favicon.ico",
    "cor_primaria": "#22c55e",
    "cor_secundaria": "#16a34a",
    "cor_acento": "#059669",
    "cor_fundo": "#ffffff",
    "cor_texto": "#1f2937",
    "nome_app": "FitPro",
    "slogan": "Transforme seu corpo e mente",
    "email_suporte": "suporte@fitpro.com",
    "telefone_suporte": "+55 11 98765-4321",
    "meta_titulo": "FitPro - Personal Training Online",
    "meta_descricao": "Plataforma completa de treinos personalizados",
    "meta_keywords": "treino, fitness, personal",
    "facebook_url": "https://facebook.com/fitpro",
    "instagram_url": "https://instagram.com/fitpro",
    "twitter_url": null,
    "linkedin_url": null,
    "youtube_url": null,
    "ocultar_marca_wazefit": false,
    "custom_css": null,
    "custom_js": null,
    "criado_em": "2026-03-27T10:00:00Z",
    "atualizado_em": "2026-03-27T10:15:00Z"
  }
}
```

---

### PUT `/api/v1/tenant/white-label`

Atualizar configurações de white label.

**Auth:** Expert only

**Body:**
```json
{
  "cor_primaria": "#ff6b6b",
  "cor_secundaria": "#ee5a6f",
  "nome_app": "FitPro",
  "slogan": "Seu treino, seu ritmo",
  "email_suporte": "contato@fitpro.com",
  "meta_titulo": "FitPro - Treinos Online",
  "facebook_url": "https://facebook.com/fitpro",
  "instagram_url": "https://instagram.com/fitpro",
  "ocultar_marca_wazefit": true
}
```

**Validações:**
- Cores devem ser hexadecimais válidos (`#RRGGBB`)
- `ocultar_marca_wazefit` só funciona no plano **Enterprise**
- URLs sociais devem ser válidas

**Response:**
```json
{
  "data": { /* settings atualizados */ }
}
```

**Errors:**
- `403`: Tentou ocultar marca WazeFit sem plano Enterprise

---

### POST `/api/v1/tenant/white-label/logo`

Upload de logo (multipart/form-data).

**Auth:** Expert only

**Body:** `multipart/form-data`
- Campo: `logo`
- Tipos aceitos: PNG, JPEG, WebP, SVG
- Tamanho máximo: **2MB**

**Response:**
```json
{
  "logo_url": "https://r2.wazefit.com/white-label/tn_xyz/logo-1711537200000.png"
}
```

**Errors:**
- `400`: Tipo de arquivo inválido ou muito grande

---

### POST `/api/v1/tenant/white-label/favicon`

Upload de favicon.

**Auth:** Expert only

**Body:** `multipart/form-data`
- Campo: `favicon`
- Tipos aceitos: ICO, PNG
- Tamanho máximo: **500KB**

**Response:**
```json
{
  "favicon_url": "https://r2.wazefit.com/white-label/tn_xyz/favicon-1711537200000.ico"
}
```

---

### DELETE `/api/v1/tenant/white-label/logo`

Remover logo (volta para logo padrão WazeFit).

**Auth:** Expert only

**Response:**
```json
{
  "message": "Logo removido."
}
```

---

## 🌐 Custom Domains

### GET `/api/v1/tenant/domains`

Listar domínios customizados do tenant.

**Auth:** Expert only

**Response:**
```json
{
  "data": [
    {
      "id": "dom_abc123",
      "dominio": "app.fitpro.com",
      "tipo": "custom",
      "status": "active",
      "verificado": true,
      "verificado_em": "2026-03-27T10:30:00Z",
      "dns_configured": true,
      "dns_records": [
        {
          "type": "CNAME",
          "name": "app.fitpro.com",
          "value": "wazefit.pages.dev",
          "ttl": 3600
        },
        {
          "type": "TXT",
          "name": "_wazefit-verify.app.fitpro.com",
          "value": "wazefit-verify-xyz123",
          "ttl": 3600
        }
      ],
      "ssl_status": "active",
      "ssl_emitido_em": "2026-03-27T10:30:00Z",
      "ssl_expira_em": null,
      "erro": null,
      "criado_em": "2026-03-27T10:00:00Z"
    }
  ]
}
```

---

### POST `/api/v1/tenant/domains`

Adicionar domínio customizado.

**Auth:** Expert only

**Body:**
```json
{
  "dominio": "app.fitpro.com",
  "tipo": "custom"
}
```

**Validações:**
- Domínio deve ser válido (formato `subdomain.domain.tld`)
- Verifica limite do plano (Pro = 1, Enterprise = 5)
- Domínio não pode estar em uso por outro tenant

**Response:**
```json
{
  "id": "dom_abc123",
  "dominio": "app.fitpro.com",
  "status": "pending",
  "dns_records": [
    {
      "type": "CNAME",
      "name": "app.fitpro.com",
      "value": "wazefit.pages.dev",
      "ttl": 3600
    },
    {
      "type": "TXT",
      "name": "_wazefit-verify.app.fitpro.com",
      "value": "wazefit-verify-xyz123",
      "ttl": 3600
    }
  ],
  "validation_token": "wazefit-verify-xyz123",
  "message": "Domínio registrado. Configure os DNS records abaixo e clique em 'Verificar'."
}
```

**Errors:**
- `403`: Limite de domínios atingido ou plano não suporta domínios customizados
- `409`: Domínio já cadastrado em outro tenant

---

### POST `/api/v1/tenant/domains/:id/verify`

Verificar DNS do domínio.

**Auth:** Expert only

**Response (sucesso):**
```json
{
  "success": true,
  "dns_configured": true,
  "ssl_ready": true,
  "message": "Domínio verificado com sucesso! SSL será provisionado automaticamente."
}
```

**Response (falha):**
```json
{
  "success": false,
  "dns_configured": false,
  "ssl_ready": false,
  "errors": [
    "CNAME não aponta para wazefit.pages.dev",
    "TXT record de validação não encontrado ou incorreto"
  ]
}
```

**Como funciona:**
1. Verifica CNAME via DNS over HTTPS (Cloudflare)
2. Verifica TXT record de validação
3. Se ambos OK, marca como `active` e provisiona SSL automaticamente
4. Registra tentativa em `domain_verification_logs`

---

### DELETE `/api/v1/tenant/domains/:id`

Remover domínio customizado.

**Auth:** Expert only

**Response:**
```json
{
  "message": "Domínio removido."
}
```

**Nota:** Soft delete (campo `deletado_em`).

---

## 🌍 Public API

### GET `/api/v1/public/white-label`

Buscar white label settings por domínio (sem autenticação).

**Uso:** Frontend carrega cores/logo antes do login baseado no hostname.

**Como funciona:**
1. Extrai hostname da requisição
2. Busca em `custom_domains` (domínios customizados ativos)
3. Se não encontrar, tenta subdomain `*.wazefit.com` (busca por `slug`)
4. Se não encontrar tenant, retorna settings padrão WazeFit

**Response:**
```json
{
  "data": {
    "logo_url": "https://r2.wazefit.com/white-label/tn_xyz/logo.png",
    "favicon_url": "https://r2.wazefit.com/white-label/tn_xyz/favicon.ico",
    "cor_primaria": "#22c55e",
    "cor_secundaria": "#16a34a",
    "cor_acento": "#059669",
    "cor_fundo": "#ffffff",
    "cor_texto": "#1f2937",
    "nome_app": "FitPro",
    "slogan": "Transforme seu corpo",
    "meta_titulo": "FitPro - Personal Training",
    "meta_descricao": "Plataforma completa de treinos",
    "ocultar_marca_wazefit": false,
    "custom_css": ".btn-primary { border-radius: 8px; }"
  }
}
```

**Exemplo de uso no frontend:**
```ts
// Carrega white label automaticamente baseado no domínio
const { data } = await fetch('/api/v1/public/white-label').then(r => r.json())

// Aplica cores CSS
document.documentElement.style.setProperty('--color-primary', data.cor_primaria)
document.documentElement.style.setProperty('--color-secondary', data.cor_secundaria)

// Atualiza título e meta tags
document.title = data.meta_titulo || data.nome_app || 'WazeFit'
```

---

## 📊 Limites por Plano

| Plano        | Domínios Customizados | Ocultar Marca WazeFit |
|--------------|----------------------|-----------------------|
| Trial        | 0                    | ❌                     |
| Starter      | 0                    | ❌                     |
| Pro          | 1                    | ❌                     |
| Enterprise   | 5                    | ✅                     |

**Código:**
```ts
export const DOMAIN_LIMITS: Record<string, number> = {
  trial: 0,
  starter: 0,
  pro: 1,
  enterprise: 5,
}

export const WHITE_LABEL_FEATURES: Record<string, { custom_domain: boolean; hide_branding: boolean }> = {
  trial: { custom_domain: false, hide_branding: false },
  starter: { custom_domain: false, hide_branding: false },
  pro: { custom_domain: true, hide_branding: false },
  enterprise: { custom_domain: true, hide_branding: true },
}
```

---

## 🚀 Fluxo de Setup

### 1. Configurar White Label

```bash
# 1. Atualizar cores e textos
PUT /api/v1/tenant/white-label
{
  "cor_primaria": "#ff6b6b",
  "nome_app": "FitPro",
  "slogan": "Seu treino, seu ritmo"
}

# 2. Upload logo
POST /api/v1/tenant/white-label/logo
Content-Type: multipart/form-data
logo: (arquivo PNG/JPEG/SVG)

# 3. Upload favicon
POST /api/v1/tenant/white-label/favicon
Content-Type: multipart/form-data
favicon: (arquivo ICO/PNG)
```

---

### 2. Adicionar Domínio Customizado

```bash
# 1. Criar domínio
POST /api/v1/tenant/domains
{
  "dominio": "app.fitpro.com"
}

# Response:
{
  "dns_records": [
    { "type": "CNAME", "name": "app.fitpro.com", "value": "wazefit.pages.dev" },
    { "type": "TXT", "name": "_wazefit-verify.app.fitpro.com", "value": "wazefit-verify-xyz123" }
  ],
  "message": "Configure os DNS records..."
}
```

---

### 3. Configurar DNS (no provedor do domínio)

**Exemplo Cloudflare:**
1. Acesse DNS settings de `fitpro.com`
2. Adicione:
   - **CNAME:** `app` → `wazefit.pages.dev` (Proxied ✅)
   - **TXT:** `_wazefit-verify.app` → `wazefit-verify-xyz123`

**Exemplo GoDaddy/Registro.br:**
1. Acesse gerenciamento de DNS
2. Adicione:
   - **CNAME:** `app` → `wazefit.pages.dev`
   - **TXT:** `_wazefit-verify.app` → `wazefit-verify-xyz123`

---

### 4. Verificar Domínio

```bash
POST /api/v1/tenant/domains/:id/verify

# Response (sucesso):
{
  "success": true,
  "dns_configured": true,
  "ssl_ready": true,
  "message": "Domínio verificado! SSL será provisionado automaticamente."
}
```

---

### 5. Acessar App

Após verificação bem-sucedida:
- `https://app.fitpro.com` → Carrega frontend com white label do tenant
- Logo, cores, favicon aplicados automaticamente
- SSL ativo (Cloudflare provisiona automaticamente)

---

## 🔒 Segurança

### CORS Dinâmico

O middleware CORS aceita:
- `localhost:*` (dev)
- `*.wazefit.com`
- `*.wazefit.pages.dev`
- **Domínios customizados ativos** (verificados em `custom_domains`)

### Tenant Detection

Middleware detecta tenant por:
1. **JWT** (header Authorization) — prioridade máxima
2. **Custom domain** (busca em `custom_domains` por hostname)
3. **Subdomain** `*.wazefit.com` (busca em `tenants` por slug)

---

## 📝 Logs de Verificação

Cada tentativa de verificação é registrada em `domain_verification_logs`:

```sql
SELECT * FROM domain_verification_logs 
WHERE domain_id = 'dom_abc123' 
ORDER BY criado_em DESC;
```

**Campos:**
- `tipo`: `dns` | `http` | `txt`
- `sucesso`: boolean
- `detalhes_json`: Detalhes da verificação (CNAME encontrado, TXT value, etc)
- `erro`: Mensagem de erro se falhou

---

## 🎯 Próximos Passos

- [ ] Implementar lookup de tenant por slug (subdomain `*.wazefit.com`)
- [ ] Adicionar suporte a múltiplos domínios por tenant (Enterprise)
- [ ] Webhook de notificação quando SSL expirar
- [ ] Dashboard de analytics por domínio
- [ ] Custom JS/CSS injection (sandbox seguro)
