"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  FileText,
  Brain,
  Apple,
  BarChart3,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/expert/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Alunos",
    href: "/expert/alunos",
    icon: Users,
  },
  {
    name: "Fichas",
    href: "/expert/fichas",
    icon: FileText,
  },
  {
    name: "IA Assistant",
    href: "/expert/ia",
    icon: Brain,
  },
  {
    name: "Nutrição",
    href: "/expert/nutricao",
    icon: Apple,
  },
  {
    name: "Analytics",
    href: "/expert/analytics",
    icon: BarChart3,
  },
];

export function ExpertSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">WazeFit</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
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
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </div>
  );
}
