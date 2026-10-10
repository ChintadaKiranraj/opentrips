"use server";

import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";

export async function signInWithGoogle(redirectTo: string) {
  if (!process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) {
    redirect("/sign-in?error=Configuration");
  }

  const isLocalPath = redirectTo.startsWith("/") && !redirectTo.startsWith("//");
  await signIn("google", { redirectTo: isLocalPath ? redirectTo : "/" });
}

export async function signOutUser() {
  await signOut({ redirectTo: "/sign-in" });
}
