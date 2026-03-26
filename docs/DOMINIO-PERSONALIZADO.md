# 🌐 Manual de Configuração de Domínio Personalizado

Este guia mostra como configurar seu próprio domínio (ex: `app.minhaacademia.com`) para seus alunos acessarem a plataforma WazeFit.

---

## 📋 Requisitos

- Ter um domínio próprio registrado (ex: `minhaacademia.com`)
- Acesso ao painel DNS do provedor (Registro.br, GoDaddy, Hostinger, etc.)
- Conta WazeFit ativa (Expert)

---

## 🚀 Passo a Passo

### 1️⃣ Escolha um Subdomínio

Decida qual subdomínio usar para a plataforma. Exemplos:

- `app.minhaacademia.com`
- `treino.seusite.com`
- `alunos.personaltrainer.com.br`

**⚠️ Importante:** Use sempre um **subdomínio**, nunca o domínio raiz (`minhaacademia.com` direto).

---

### 2️⃣ Configure o DNS

Acesse o painel do seu provedor de domínio e adicione um **registro CNAME**:

| Campo | Valor |
|-------|-------|
| **Tipo** | `CNAME` |
| **Nome/Host** | `app` (ou o subdomínio escolhido) |
| **Destino/Valor** | `wazefit.pages.dev` |
| **TTL** | `Auto` ou `3600` |

#### Exemplos por Provedor:

<details>
<summary><strong>Registro.br</strong></summary>

1. Acesse https://registro.br
2. Faça login → **Meus Domínios**
3. Clique em **Editar Zona**
4. Adicione nova entrada:
   - Tipo: `CNAME`
   - Nome: `app`
   - Dados: `wazefit.pages.dev`
5. Salve

</details>

<details>
<summary><strong>GoDaddy</strong></summary>

1. Acesse https://godaddy.com
2. **Meus Produtos** → **DNS**
3. Clique em **Adicionar**
4. Selecione:
   - Tipo: `CNAME`
   - Nome: `app`
   - Valor: `wazefit.pages.dev`
   - TTL: `1 hora`
5. Salve

</details>

<details>
<summary><strong>Hostinger</strong></summary>

1. Acesse o painel Hostinger
2. **Domínios** → **Gerenciar**
3. **DNS/Nameservers** → **Zona DNS**
4. Adicione:
   - Tipo: `CNAME`
   - Nome: `app`
   - Aponta para: `wazefit.pages.dev`
5. Salve

</details>

<details>
<summary><strong>Cloudflare</strong></summary>

1. Acesse https://dash.cloudflare.com
2. Selecione seu domínio
3. **DNS** → **Adicionar registro**
4. Configure:
   - Tipo: `CNAME`
   - Nome: `app`
   - Destino: `wazefit.pages.dev`
   - Proxy status: 🟠 **Desligado** (DNS only)
5. Salve

**⚠️ Cloudflare:** Certifique-se de deixar o proxy **DESLIGADO** (ícone cinza).

</details>

---

### 3️⃣ Adicione o Domínio na WazeFit

1. Acesse o painel WazeFit: https://wazefit.pages.dev
2. Faça login como **Expert**
3. Vá em **Domínios** (menu lateral)
4. Clique em **Adicionar Novo Domínio**
5. Digite o domínio completo: `app.minhaacademia.com`
6. Clique em **Adicionar**

---

### 4️⃣ Aguarde a Propagação

- **Tempo médio:** 15-30 minutos
- **Máximo:** Até 48 horas (raro)

**Como verificar:**

```bash
# No terminal (Linux/Mac)
dig app.minhaacademia.com CNAME

# Ou use ferramentas online:
# https://dnschecker.org
```

O resultado deve mostrar `wazefit.pages.dev` como destino.

---

### 5️⃣ Teste o Acesso

Após a propagação, acesse seu domínio personalizado:

```
https://app.minhaacademia.com
```

Você verá a tela de login da WazeFit! 🎉

---

## ✅ SSL/HTTPS

O certificado SSL (HTTPS) é **configurado automaticamente** pelo Cloudflare Pages.

- ✅ Não precisa fazer nada
- ✅ Funciona em segundos após a propagação
- ✅ Renovação automática

---

## 🔧 Troubleshooting

### ❌ "DNS_PROBE_FINISHED_NXDOMAIN"

**Causa:** DNS ainda não propagou ou CNAME incorreto.

**Solução:**
1. Verifique se o registro CNAME está correto no painel DNS
2. Aguarde mais tempo (até 24h)
3. Limpe o cache DNS do seu computador:

```bash
# Windows
ipconfig /flushdns

# Mac
sudo dscacheutil -flushcache

# Linux
sudo systemd-resolve --flush-caches
```

---

### ❌ "ERR_SSL_VERSION_OR_CIPHER_MISMATCH"

**Causa:** SSL ainda não foi provisionado.

**Solução:**
- Aguarde 5-10 minutos após a propagação do DNS
- O Cloudflare provisiona o SSL automaticamente

---

### ❌ "This site can't be reached"

**Causa:** CNAME aponta para o destino errado.

**Solução:**
- Certifique-se de que o CNAME aponta para `wazefit.pages.dev` (exatamente)
- Não use IP, apenas o domínio

---

### ❌ Cloudflare: "Error 1014: CNAME Cross-User Banned"

**Causa:** Proxy do Cloudflare está **ligado** (ícone laranja).

**Solução:**
1. No painel Cloudflare, clique no ícone laranja ao lado do registro CNAME
2. Mude para **DNS only** (ícone cinza)
3. Aguarde alguns minutos

---

## 📊 Múltiplos Domínios

Você pode ter **vários domínios** apontando para a mesma conta:

- `app.minhaacademia.com`
- `treino.personaltrainer.com.br`
- `alunos.fit.com`

Basta repetir o processo para cada domínio!

---

## 🎯 Domínio Padrão

Mesmo com domínio personalizado, o acesso via subdomínio WazeFit continua funcionando:

- `https://seuslug.wazefit.com` ✅
- `https://app.seudominio.com` ✅

Ambos funcionam simultaneamente!

---

## 🔒 Segurança

- ✅ **HTTPS obrigatório:** Todos os acessos são criptografados
- ✅ **Certificado válido:** Emitido automaticamente pelo Cloudflare
- ✅ **Renovação automática:** Sem preocupação com expiração

---

## 💡 Dicas

### White Label Completo

Para uma experiência 100% personalizada:

1. Configure o domínio personalizado
2. Adicione seu logo na página de **Configurações**
3. Personalize cores e branding (em breve)

### E-mail Marketing

Use seu domínio personalizado nos e-mails de boas-vindas:

```
Olá João! Acesse sua área de treinos em:
👉 https://app.minhaacademia.com
```

Muito mais profissional que `wazefit.com`! 💪

---

## 📞 Suporte

Precisa de ajuda? Entre em contato:

- 📧 Email: suporte@wazefit.com
- 💬 Chat: Dentro da plataforma
- 📱 WhatsApp: (em breve)

---

## 📝 Checklist Rápido

- [ ] Registro CNAME criado no DNS
- [ ] Destino correto: `wazefit.pages.dev`
- [ ] Domínio adicionado no painel WazeFit
- [ ] Aguardou propagação (15-30 min)
- [ ] Testou acesso via HTTPS
- [ ] SSL funcionando (cadeado verde)

---

**Última atualização:** 26 de março de 2026
**Versão:** 1.0
