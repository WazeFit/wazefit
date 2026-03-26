-- Migration: Add cloudflare_dns_id to dominios_tenant
-- Created: 2026-03-26

ALTER TABLE dominios_tenant ADD COLUMN cloudflare_dns_id TEXT;
