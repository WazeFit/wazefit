"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Dumbbell, Apple, Trophy, MessageCircle, User } from "lucide-react";

const navigation = [
  { name: "Treinos", href: "/user/treinos", icon: Dumbbell },
  { name: "Dieta", href: "/user/dieta", icon: Apple },
  { name: "Ranking", href: "/user/ranking", icon: Trophy },
  { name: "Chat", href: "/user/chat", icon: MessageCircle },
  { name: "Perfil", href: "/user/perfil", icon: User },
];

export function UserNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around px-4 py-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors min-w-[64px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive && "fill-primary")} />
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
