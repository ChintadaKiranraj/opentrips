import { connection } from "next/server";

import { auth } from "@/auth";
import { UserMenuButton } from "@/components/auth/UserMenuButton";

export async function UserMenu() {
  await connection();
  const session = await auth();
  if (!session?.user) return null;

  return (
    <UserMenuButton
      name={session.user.name ?? "Traveler"}
      email={session.user.email ?? ""}
      image={session.user.image ?? null}
    />
  );
}
