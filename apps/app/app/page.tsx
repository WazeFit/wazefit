export const runtime = 'edge';
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Redireciona baseado no role
  if (user.role === "expert") {
    redirect("/expert/dashboard");
  } else {
    redirect("/user/treinos");
  }
}
