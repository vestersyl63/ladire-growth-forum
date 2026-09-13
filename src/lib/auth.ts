import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/** Convenience wrapper used by server components: returns session or null. */
export async function getSession() {
  try {
    return await auth();
  } catch {
    return null;
  }
}
