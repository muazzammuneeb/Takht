import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false } };

/** Bare layout: artboards render at exact pixel size with no site chrome. */
export default function RenderLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "inline-block", lineHeight: 0 }}>{children}</div>;
}
