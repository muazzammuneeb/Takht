import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap" style={{ textAlign: "center", padding: "48px 16px" }}>
          <h1>Not on the board</h1>
          <p className="muted">We couldn&apos;t find that page.</p>
          <Link className="btn" href="/">
            Back to the Takht
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
