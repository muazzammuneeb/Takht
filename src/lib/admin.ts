import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "takht_admin";

function token(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  const secret = process.env.ADMIN_SECRET || pw;
  return createHmac("sha256", secret).update(`takht-admin:${pw}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export async function isAdmin(): Promise<boolean> {
  const t = token();
  if (!t) return false;
  const c = (await cookies()).get(COOKIE)?.value;
  return Boolean(c && safeEqual(c, t));
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin");
}

export async function logIn(password: string): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD;
  const t = token();
  if (!pw || !t || !safeEqual(password, pw)) return false;
  (await cookies()).set(COOKIE, t, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return true;
}

export async function logOut(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
