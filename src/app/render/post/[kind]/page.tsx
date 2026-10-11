import { notFound } from "next/navigation";
import { DarbarWidePost, NewKingPost, TruckSquarePost } from "@/components/cards";
import { isAdmin } from "@/lib/admin";
import { snapshot } from "@/lib/data";
import { newKing, postData } from "@/lib/posts";

export const dynamic = "force-dynamic";

/** Daily social images: /render/post/darbar-wide, /render/post/truck-square, /render/post/new-king */
export default async function RenderPost({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  // Posts include totals and are only for Takht's own accounts; keep them behind admin in production.
  if (process.env.NODE_ENV === "production" && !(await isAdmin())) notFound();
  const snap = await snapshot();
  if (kind === "darbar-wide") {
    return (
      <div id="art">
        <DarbarWidePost d={postData(snap)} />
      </div>
    );
  }
  if (kind === "truck-square") {
    return (
      <div id="art">
        <TruckSquarePost d={postData(snap)} />
      </div>
    );
  }
  if (kind === "new-king") {
    const k = newKing(snap);
    if (!k) notFound();
    return (
      <div id="art">
        <NewKingPost d={k.data} />
      </div>
    );
  }
  notFound();
}
