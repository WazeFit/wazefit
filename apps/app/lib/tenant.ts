import { headers } from "next/headers";

export interface TenantConfig {
  id: string;
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  domain: string;
}

// Default tenant (fallback)
const DEFAULT_TENANT: TenantConfig = {
  id: "default",
  name: "WazeFit",
  logo: "/wazefit-logo.svg",
  primaryColor: "240 5.9% 10%",
  secondaryColor: "240 4.8% 95.9%",
  domain: "wazefit.com",
};

/**
 * Detecta o tenant baseado no hostname da requisição
 * Em produção, isso consultaria a API ou um cache
 */
export async function getTenant(): Promise<TenantConfig> {
  const headersList = await headers();
  const host = headersList.get("host") || "";

  // Em desenvolvimento, retorna o tenant default
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return DEFAULT_TENANT;
  }

  // TODO: Consultar API para buscar configuração do tenant
  // const response = await fetch(`https://api.wazefit.com/tenants/by-domain/${host}`);
  // const tenant = await response.json();
  // return tenant;

  return DEFAULT_TENANT;
}

/**
 * Aplica as cores do tenant como CSS variables
 */
export function getTenantStyles(tenant: TenantConfig): string {
  return `
    :root {
      --primary: ${tenant.primaryColor};
      --secondary: ${tenant.secondaryColor};
    }
  `;
}
