# ⚡ Domínio Personalizado - Quick Start

## 🎯 Objetivo

Fazer seus alunos acessarem a plataforma pelo SEU domínio:

```
❌ aluno123.wazefit.com
✅ app.minhaacademia.com
```

---

## 🚀 3 Passos Rápidos

### 1. Configure o DNS (5 min)

No painel do seu domínio, adicione:

```
Tipo:    CNAME
Nome:    app
Destino: wazefit.pages.dev
```

### 2. Adicione aqui na WazeFit (30 seg)

Menu **Domínios** → Digite `app.seudominio.com` → **Adicionar**

### 3. Aguarde (15-30 min)

O DNS propaga automaticamente. Pronto! 🎉

---

## 📋 Exemplo Real

**Seu domínio:** `personalfit.com.br`
**Subdomínio escolhido:** `app`

**No DNS:**
```
CNAME  app  →  wazefit.pages.dev
```

**Resultado:**
```
https://app.personalfit.com.br
```

---

## ✅ Checklist

- [ ] Tenho acesso ao painel DNS do meu domínio
- [ ] Criei o registro CNAME apontando para `wazefit.pages.dev`
- [ ] Adicionei o domínio aqui na WazeFit
- [ ] Aguardei 15-30 minutos
- [ ] Testei o acesso via HTTPS

---

## 🆘 Problemas?

**Não funciona após 30 min?**
1. Verifique se o CNAME está correto
2. Limpe o cache DNS: `ipconfig /flushdns` (Windows) ou `sudo dscacheutil -flushcache` (Mac)
3. Teste em https://dnschecker.org

**SSL não funciona?**
- Aguarde mais 5-10 min após o DNS propagar
- O certificado é gerado automaticamente

---

## 📖 Guia Completo

Para instruções detalhadas por provedor (Registro.br, GoDaddy, etc.):
👉 Veja `DOMINIO-PERSONALIZADO.md`

---

**Tempo total:** ~20 minutos (incluindo propagação)
**Dificuldade:** ⭐⭐☆☆☆ (Básico)
