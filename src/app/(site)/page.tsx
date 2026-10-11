import { BoardView, type BoardSearchParams } from "@/components/BoardView";

export const dynamic = "force-dynamic";

export default function AllTimePage({ searchParams }: { searchParams: BoardSearchParams }) {
  return <BoardView scope="all" searchParams={searchParams} />;
}
