import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getTenant, getTenantStyles } from "@/lib/tenant";
import { TenantProvider } from "@/components/providers/tenant-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WazeFit",
  description: "Plataforma de gestão de treinos e nutrição",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenant = await getTenant();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: getTenantStyles(tenant) }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <TenantProvider tenant={tenant}>{children}</TenantProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
