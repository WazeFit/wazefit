# 🌐 Configuração DNS - WazeFit

## Visão Geral

A WazeFit usa uma arquitetura multi-domínio para separar frontend e backend:

```
wazefit.com              → Frontend (Cloudflare Pages)
api.wazefit.com          → Backend API (Cloudflare Workers)
*.wazefit.com            → Subdomínios de experts (white label)
app.cliente.com (CNAME)  → wazefit.com (domínios personalizados)
```

---

## 📋 Configuração no Cloudflare

### 1. Frontend Principal (`wazefit.com`)

**Tipo:** CNAME  
**Nome:** `@` (ou deixe vazio)  
**Destino:** `wazefit.pages.dev`  
**Proxy:** ✅ Proxied (laranja)

**Alternativa (se CNAME não funcionar no root):**
- **Tipo:** A
- **Nome:** `@`
- **IPv4:** `192.0.2.1` (Cloudflare placeholder)
- **Proxy:** ✅ Proxied

### 2. Frontend WWW (`www.wazefit.com`)

**Tipo:** CNAME  
**Nome:** `www`  
**Destino:** `wazefit.pages.dev`  
**Proxy:** ✅ Proxied

### 3. Backend API (`api.wazefit.com`)

**Tipo:** CNAME  
**Nome:** `api`  
**Destino:** `wazefit.workers.dev` (ou IP do Worker)  
**Proxy:** ✅ Proxied

**Nota:** Cloudflare Workers podem usar rotas customizadas. Configurar em:
- Cloudflare Dashboard → Workers → Triggers → Custom Domains
- Adicionar `api.wazefit.com` como domínio custom do Worker

### 4. Wildcard para Subdomínios de Experts (`*.wazefit.com`)

**Tipo:** CNAME  
**Nome:** `*`  
**Destino:** `wazefit.pages.dev`  
**Proxy:** ✅ Proxied

**Exemplos de subdomínios gerados:**
- `academia-fit.wazefit.com`
- `personal-joao.wazefit.com`
- `studio-pilates.wazefit.com`

---

## 🔧 Configuração de Domínios Personalizados (White Label)

Quando um expert adiciona um domínio personalizado (ex: `app.minhaacademia.com`):

### No painel do provedor do expert (Registro.br, GoDaddy, etc):

**Tipo:** CNAME  
**Nome:** `app` (ou qualquer subdomínio escolhido)  
**Destino:** `wazefit.com`  
**TTL:** 3600 (ou automático)

### No Cloudflare (WazeFit):

1. Ir em: **SSL/TLS → Custom Hostnames**
2. Adicionar: `app.minhaacademia.com`
3. Aguardar validação SSL (automática)

**Nota:** Custom Hostnames exige plano Business+ ou Workers Paid.

---

## 🚀 Deploy e Propagação

### Cloudflare Pages (Frontend)

1. **Conectar GitHub:**
   - Dashboard → Pages → Create Project
   - Conectar repo `WazeFit/wazefit`
   - Branch: `main`
   - Build command: `pnpm build --filter web`
   - Output: `apps/web/dist`

2. **Configurar domínio custom:**
   - Pages → wazefit → Custom Domains
   - Adicionar `wazefit.com` e `www.wazefit.com`

### Cloudflare Workers (Backend)

1. **Deploy:**
   ```bash
   cd workers/api
   pnpm wrangler deploy
   ```

2. **Configurar domínio custom:**
   - Workers → wazefit-api → Triggers
   - Add Custom Domain: `api.wazefit.com`

### Verificação

```bash
# Frontend
curl -I https://wazefit.com
curl -I https://www.wazefit.com

# Backend
curl -I https://api.wazefit.com/health

# Wildcard
curl -I https://teste.wazefit.com
```

---

## ⚙️ Variáveis de Ambiente

### Frontend (`apps/web/.env`)

```bash
# Produção (automático no Cloudflare Pages)
VITE_API_URL=https://api.wazefit.com

# Desenvolvimento local
VITE_API_URL=http://localhost:8787
```

### Backend (`workers/api/wrangler.toml`)

```toml
[env.production]
name = "wazefit-api"
routes = [
  { pattern = "api.wazefit.com/*", zone_name = "wazefit.com" }
]

[env.production.vars]
FRONTEND_URLS = "https://wazefit.com,https://www.wazefit.com"
```

---

## 🔒 SSL/TLS

- **Modo:** Full (strict)
- **Edge Certificates:** Automático (Universal SSL)
- **Custom Hostnames:** Automático para domínios de experts
- **HSTS:** Habilitado
- **Min TLS Version:** 1.2

---

## 🧪 Testes

### 1. DNS Propagation

```bash
# Verificar DNS
dig wazefit.com
dig api.wazefit.com
dig www.wazefit.com

# Verificar globalmente
https://dnschecker.org/#A/wazefit.com
```

### 2. SSL

```bash
# Verificar certificado
openssl s_client -connect wazefit.com:443 -servername wazefit.com
openssl s_client -connect api.wazefit.com:443 -servername api.wazefit.com
```

### 3. CORS

```bash
# Testar CORS do backend
curl -H "Origin: https://wazefit.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://api.wazefit.com/api/v1/alunos
```

---

## 📊 Monitoramento

- **Cloudflare Analytics:** Dashboard → Analytics
- **Workers Logs:** `wrangler tail`
- **Pages Logs:** Dashboard → Pages → Deployment logs

---

## 🐛 Troubleshooting

### Erro: "Too many redirects"
- Verificar SSL mode (deve ser Full ou Full Strict)
- Desabilitar "Always Use HTTPS" temporariamente

### Erro: "DNS_PROBE_FINISHED_NXDOMAIN"
- Aguardar propagação DNS (até 48h)
- Verificar registros no Cloudflare Dashboard

### Erro: "CORS policy blocked"
- Verificar `FRONTEND_URLS` no Worker
- Adicionar domínio personalizado na allowlist

### API retorna 404
- Verificar rota do Worker em Triggers
- Verificar deploy: `wrangler deployments list`

---

## 📚 Referências

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Custom Hostnames](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/)
- [DNS Records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/)
