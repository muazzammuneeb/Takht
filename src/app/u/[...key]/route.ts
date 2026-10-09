import { store } from "@/lib/db";

/** Public files (logos only). Served from our own origin so PNG export can embed them. */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  if (!/^logos\/[\w-]+\.(png|jpg|webp)$/.test(key)) return new Response("Not found", { status: 404 });
  const file = await store().getFile(key);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
