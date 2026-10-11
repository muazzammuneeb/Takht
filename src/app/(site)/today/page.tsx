import type { Metadata } from "next";
import { BoardView, type BoardSearchParams } from "@/components/BoardView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Today's board" };

export default function TodayPage({ searchParams }: { searchParams: BoardSearchParams }) {
  return <BoardView scope="today" searchParams={searchParams} />;
}
