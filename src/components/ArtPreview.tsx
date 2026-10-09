"use client";

import { toPng } from "html-to-image";
import { useEffect, useRef, useState } from "react";

/**
 * Shows a fixed-size artboard scaled to fit its container, and exports the unscaled node to PNG.
 * The scale transform lives on a wrapper, so the exported node is always the exact pixel size.
 */
export function ArtPreview({
  width,
  height,
  filename,
  children,
  label = "Download PNG",
}: {
  width: number;
  height: number;
  filename: string;
  children: React.ReactNode;
  label?: string;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  async function download() {
    const node = art.current?.firstElementChild as HTMLElement | null;
    if (!node) return;
    setBusy(true);
    setError(null);
    try {
      const url = await exportPng(node, width, height);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
    } catch (e) {
      console.error(e);
      setError("Couldn't create the image. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="share-preview">
      <div ref={outer} className="share-stage" style={{ aspectRatio: `${width} / ${height}` }}>
        <div ref={art} className="share-scale" style={{ width, height, transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>
      <div className="share-controls" style={{ marginTop: 12 }}>
        <button type="button" className="btn" onClick={download} disabled={busy}>
          {busy ? "Preparing…" : label}
        </button>
      </div>
      {error && (
        <p className="error" role="alert" style={{ marginTop: 12 }}>
          {error}
        </p>
      )}
    </div>
  );
}

export async function exportPng(node: HTMLElement, width: number, height: number): Promise<string> {
  await document.fonts.ready;
  const opts = { width, height, pixelRatio: 1, cacheBust: true, style: { transform: "none" } };
  // The first pass warms the font/image cache (Safari often drops fonts on the very first render).
  await toPng(node, opts);
  return toPng(node, opts);
}
