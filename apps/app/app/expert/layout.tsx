import { redirect } from "next/navigation";
import { getUser, isExpert } from "@/lib/auth";
import { ExpertSidebar } from "@/components/layouts/expert-sidebar";

export default async function ExpertLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isExpert(user)) {
    redirect("/user/treinos");
  }

  return (
    <div className="flex h-screen">
      <ExpertSidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
