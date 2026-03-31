import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { UserNav } from "@/components/layouts/user-nav";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <h1 className="text-lg font-semibold">WazeFit</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container px-4 py-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <UserNav />
    </div>
  );
}
