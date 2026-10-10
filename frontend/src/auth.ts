import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Google sign-in via Auth.js. Reads AUTH_SECRET, AUTH_GOOGLE_ID, and
 * AUTH_GOOGLE_SECRET from the environment. Sessions are stateless JWT cookies,
 * so no database is required.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  callbacks: {
    authorized({ auth: session, request }) {
      if (session?.user) return true;
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return Response.json({ error: "Unauthorized", details: "Please sign in first." }, { status: 401 });
      }
      return false;
    },
  },
});
