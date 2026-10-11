import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
