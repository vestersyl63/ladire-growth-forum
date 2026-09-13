"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema, registerSchema, passwordSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/password";
import { notify } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

export type ActionResult = { ok: boolean; error?: string; field?: string };

export async function signOutUser(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

/** Register a new account with phone (or email) + password. No OTP is used. */
export async function registerUser(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const data = Object.fromEntries(formData.entries());

  // Reject obviously-malformed payloads before hashing cost.
  const parsed = registerSchema.safeParse({
    fullName: data.fullName,
    phone: data.phone,
    email: data.email || undefined,
    password: data.password,
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Please check the form.", field: first?.path?.[0] as string };
  }
  const { fullName, phone, email, password } = parsed.data;

  const rl = rateLimit("register", { limit: 6, windowSec: 900 });
  if (!rl.ok) return { ok: false, error: "Too many attempts. Please try again later." };

  const existing = await prisma.user.findFirst({
    where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
  });
  if (existing) {
    if (existing.phone === phone)
      return { ok: false, error: "An account with this phone number already exists. Try logging in." };
    return { ok: false, error: "An account with this email already exists. Try logging in." };
  }

  const passwordCheck = passwordSchema.safeParse(password);
  if (!passwordCheck.success)
    return { ok: false, error: passwordCheck.error.issues[0]?.message ?? "Invalid password." };

  const hash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name: fullName,
      phone,
      email: email ?? null,
      passwordHash: hash,
      phoneVerified: true,
    },
  });

  await notify(user.id, {
    type: "WELCOME",
    title: `Welcome to LADIRE Growth Forum 🎉`,
    body: "Your account is ready. Explore events, join the community and vote in the LADIRE Youth & Entertainment Awards 2026.",
    link: "/dashboard",
  });
  await logAudit({
    actorKind: "USER",
    actorId: user.id,
    actorName: fullName,
    action: "USER_REGISTERED",
    entityType: "USER",
    entityId: user.id,
    metadata: { phone, email },
  });

  return { ok: true };
}

/** Log in with phone/email + password. */
export async function loginUser(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const data = Object.fromEntries(formData.entries());
  const parsed = loginSchema.safeParse({
    identifier: data.identifier,
    password: data.password,
  });
  if (!parsed.success) return { ok: false, error: "Enter your phone/email and password." };
  const { identifier, password } = parsed.data;
  const rawNext = data.next;
  const next =
    typeof rawNext === "string" && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/dashboard";

  const rl = rateLimit("login", { limit: 10, windowSec: 600 });
  if (!rl.ok) return { ok: false, error: "Too many login attempts. Please try again in a few minutes." };

  try {
    await signIn("credentials", { identifier, password, redirectTo: next });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin")
        return { ok: false, error: "Invalid phone number/email or password." };
      return { ok: false, error: "Unable to sign in. Please try again." };
    }
    // NEXT_REDIRECT is thrown on success and must be re-thrown by caller handling.
    throw error;
  }
}

export async function continueWithGoogle(): Promise<ActionResult> {
  try {
    await signIn("google", { redirectTo: "/dashboard" });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "OAuthSignInError" || error.type === "OAuthCallbackError")
        return { ok: false, error: "Google sign-in is not configured yet. Please use phone & password." };
      return { ok: false, error: "Google sign-in failed." };
    }
    throw error;
  }
}
