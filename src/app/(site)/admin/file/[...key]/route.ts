import { isAdmin } from "@/lib/admin";
import { store } from "@/lib/db";

/** Payment screenshots, admin only. */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (!(await isAdmin())) return new Response("Forbidden", { status: 403 });
  const key = (await params).key.join("/");
  if (!/^(proofs|logos)\/[\w-]+\.(png|jpg|webp)$/.test(key)) return new Response("Not found", { status: 404 });
  const file = await store().getFile(key);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(file.data), {
    headers: { "Content-Type": file.contentType, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
