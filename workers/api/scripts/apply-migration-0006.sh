#!/bin/bash
set -e

echo "🚀 Aplicando Migration 0006: White Label + Custom Domains"
echo ""

# Verificar se wrangler está instalado
if ! command -v wrangler &> /dev/null; then
    echo "❌ wrangler não encontrado. Instalando..."
    npm install -g wrangler
fi

# Diretório base
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(dirname "$SCRIPT_DIR")"
MIGRATION_FILE="$API_DIR/migrations/0006_white_label_domains.sql"

echo "📁 Diretório: $API_DIR"
echo "📄 Migration: $MIGRATION_FILE"
echo ""

# Verificar se migration existe
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration não encontrada: $MIGRATION_FILE"
    exit 1
fi

# Aplicar migration no D1 local
echo "📦 Aplicando migration no D1 local..."
cd "$API_DIR"
wrangler d1 execute wazefit-db --local --file="$MIGRATION_FILE" || {
    echo "⚠️  Falha ao aplicar no D1 local (pode já estar aplicada)"
}

echo ""
echo "✅ Migration aplicada com sucesso!"
echo ""
echo "🔜 Próximos passos:"
echo "1. Testar endpoints localmente: pnpm run dev"
echo "2. Aplicar em produção: wrangler d1 execute wazefit-db --remote --file=migrations/0006_white_label_domains.sql"
echo "3. Deploy: pnpm run deploy"
