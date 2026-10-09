import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/config";
import { Crown } from "./Crown";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="wordmark" aria-label="Takht home">
          <Crown size={28} />
          <span className="wordmark-text">TAKHT</span>
          <span className="urdu" lang="ur">
            تخت
          </span>
        </Link>
        <nav className="site-nav" aria-label="Main">
          <Link className="navlink hide-sm" href="/rules">
            Rules
          </Link>
          <Link className="btn btn-sm" href="/add">
            List your business
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <span>© {new Date().getFullYear()} Kapeta Pvt. Ltd.</span>
        <a href="/rules">Rules &amp; refunds</a>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </div>
    </footer>
  );
}
