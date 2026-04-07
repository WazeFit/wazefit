"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  FileText,
  Brain,
  Apple,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Dumbbell,
  MessageSquare,
  DollarSign,
  ClipboardList,
  Trophy,
  Calendar,
  Globe,
  Settings,
  Shield,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/expert/dashboard", icon: LayoutDashboard },
  { name: "Alunos", href: "/expert/alunos", icon: Users },
  { name: "Exercicios", href: "/expert/exercicios", icon: Dumbbell },
  { name: "Fichas", href: "/expert/fichas", icon: FileText },
  { name: "Calendario", href: "/expert/calendario", icon: Calendar },
  { name: "Chat", href: "/expert/chat", icon: MessageSquare },
  { name: "Nutricao", href: "/expert/nutricao", icon: Apple },
  { name: "Avaliacoes", href: "/expert/avaliacoes", icon: ClipboardList },
  { name: "Briefings", href: "/expert/briefings", icon: ClipboardList },
  { name: "IA Assistant", href: "/expert/ia", icon: Brain },
  { name: "Financeiro", href: "/expert/financeiro", icon: DollarSign },
  { name: "Ranking", href: "/expert/ranking", icon: Trophy },
  { name: "Analytics", href: "/expert/analytics", icon: BarChart3 },
  { name: "Dominios", href: "/expert/dominios", icon: Globe },
  { name: "Config", href: "/expert/config", icon: Settings },
];

export function ExpertSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("wf_token");
    localStorage.removeItem("wf_user");
    localStorage.removeItem("wf_tenant");
    router.push("/login");
  };

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <Link href="/expert/dashboard" className="text-xl font-bold text-sidebar-foreground">
          WazeFit
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
}
