"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { fabric } from "fabric";
import { Wand2, Download, Sparkles, CalendarClock, Loader2 } from "lucide-react";
import { ColorPicker } from "./ColorPicker";
import { StyleToggle, type PosterStyle } from "./StyleToggle";
import { contrastText, formatINR, discountPct } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  mrp: number;
  category: string;
  imageUrl: string;
  brandColor: string;
}

interface Copy {
  tagline: string;
  caption: string;
  offer: string;
  hashtags: string[];
}

const SIZE = 1080;
const DISPLAY = 480;

export function PosterDesigner({ products }: { products: Product[] }) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [color, setColor] = useState(products[0]?.brandColor ?? "#6366F1");
  const [style, setStyle] = useState<PosterStyle>("simple");
  const [copy, setCopy] = useState<Copy | null>(null);
  const [aiSource, setAiSource] = useState<"ai" | "fallback" | null>(null);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [posterUrl, setPosterUrl] = useState("");

  const product = products.find((p) => p.id === productId);

  // Init fabric canvas once.
  useEffect(() => {
    if (!canvasElRef.current || fabricRef.current) return;
    const c = new fabric.Canvas(canvasElRef.current, {
      width: SIZE,
      height: SIZE,
      selection: false,
    });
    fabricRef.current = c;
    // Visually scale the 1080px canvas down to fit the panel.
    const wrap = (c as unknown as { wrapperEl?: HTMLElement }).wrapperEl;
    if (wrap) {
      wrap.style.transform = `scale(${DISPLAY / SIZE})`;
      wrap.style.transformOrigin = "top left";
    }
    return () => {
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
  }, []);

  // When product changes, reset color to its brand color.
  useEffect(() => {
    if (product) {
      setColor(product.brandColor);
      setCopy(null);
      setAiSource(null);
      setPosterUrl("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const draw = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || !product) return;
    canvas.clear();
    const text = contrastText(color);
    const muted = text === "#FFFFFF" ? "rgba(255,255,255,0.75)" : "rgba(15,23,42,0.6)";

    canvas.backgroundColor = color;

    // Decorative circle
    canvas.add(
      new fabric.Circle({
        radius: 320,
        left: SIZE - 160,
        top: -160,
        fill: text === "#FFFFFF" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
        selectable: false,
        evented: false,
      }),
    );

    // Brand name (top)
    canvas.add(
      new fabric.Textbox(product.name.toUpperCase(), {
        left: 80,
        top: 80,
        width: SIZE - 160,
        fontSize: 40,
        fontWeight: "700",
        fontFamily: "Arial",
        fill: text,
        charSpacing: 120,
        selectable: false,
      }),
    );

    const off = discountPct(product.mrp, product.price);
    if (off > 0) {
      canvas.add(
        new fabric.Textbox(`${off}% OFF`, {
          left: SIZE - 260,
          top: 78,
          width: 180,
          fontSize: 30,
          fontWeight: "700",
          fontFamily: "Arial",
          fill: text,
          textAlign: "right",
          backgroundColor: text === "#FFFFFF" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.08)",
          selectable: false,
        }),
      );
    }

    const finishText = () => {
      // Tagline
      const tagline = copy?.tagline || "Quality you can trust";
      canvas.add(
        new fabric.Textbox(tagline, {
          left: 80,
          top: 760,
          width: SIZE - 160,
          fontSize: 52,
          fontWeight: "700",
          fontFamily: "Arial",
          fill: text,
          textAlign: "center",
          selectable: false,
        }),
      );

      // Price row
      canvas.add(
        new fabric.Textbox(formatINR(product.price), {
          left: 80,
          top: 880,
          width: SIZE - 160,
          fontSize: 72,
          fontWeight: "800",
          fontFamily: "Arial",
          fill: text,
          textAlign: "center",
          selectable: false,
        }),
      );
      if (product.mrp > product.price) {
        canvas.add(
          new fabric.Textbox(`MRP ${formatINR(product.mrp)}`, {
            left: 80,
            top: 968,
            width: SIZE - 160,
            fontSize: 30,
            fontFamily: "Arial",
            fill: muted,
            textAlign: "center",
            linethrough: true,
            selectable: false,
          }),
        );
      }

      if (style === "detailed") {
        // Features from description (first 3 chunks)
        const feats = product.description
          .split(/[.,]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 3);
        feats.forEach((f, i) => {
          canvas.add(
            new fabric.Textbox(`•  ${f}`, {
              left: 90,
              top: 600 + i * 46,
              width: SIZE - 180,
              fontSize: 30,
              fontFamily: "Arial",
              fill: muted,
              textAlign: "center",
              selectable: false,
            }),
          );
        });
        // Offer badge
        if (copy?.offer) {
          canvas.add(
            new fabric.Textbox(copy.offer.toUpperCase(), {
              left: 80,
              top: 700,
              width: SIZE - 160,
              fontSize: 28,
              fontWeight: "700",
              fontFamily: "Arial",
              fill: text,
              textAlign: "center",
              charSpacing: 100,
              selectable: false,
            }),
          );
        }
      }
      canvas.renderAll();
    };

    // Product image (center)
    if (product.imageUrl) {
      fabric.Image.fromURL(
        product.imageUrl,
        (img) => {
          const target = 460;
          const scale = target / Math.max(img.width ?? target, img.height ?? target);
          img.set({
            left: SIZE / 2,
            top: 380,
            originX: "center",
            originY: "center",
            scaleX: scale,
            scaleY: scale,
            selectable: false,
            shadow: new fabric.Shadow({
              color: "rgba(0,0,0,0.25)",
              blur: 40,
              offsetX: 0,
              offsetY: 20,
            }),
          });
          canvas.add(img);
          finishText();
        },
        { crossOrigin: "anonymous" },
      );
    } else {
      finishText();
    }
  }, [product, color, style, copy]);

  useEffect(() => {
    draw();
  }, [draw]);

  async function generateCopy() {
    if (!product) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/poster/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (res.ok) {
        setCopy(data.copy);
        setAiSource(data.source);
      }
    } finally {
      setGenerating(false);
    }
  }

  async function exportPoster() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    setExporting(true);
    try {
      const dataUrl = canvas.toDataURL({ format: "png", quality: 1, multiplier: 1 });
      const blob = await (await fetch(dataUrl)).blob();
      const fd = new FormData();
      fd.append("file", blob, `poster-${productId}.png`);
      fd.append("folder", "posters");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) setPosterUrl(data.url);

      // Trigger download too
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${product?.name ?? "poster"}.png`;
      a.click();
    } finally {
      setExporting(false);
    }
  }

  if (products.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center p-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-lav">
          <Wand2 className="h-6 w-6 text-indigo-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-ink">No products to design</h3>
        <p className="mt-1 text-sm text-muted">Add a product first, then come back to design a poster.</p>
        <Link href="/products" className="btn-primary mt-5">Go to Products</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Poster Designer</h1>
        <p className="mt-1 text-sm text-muted">
          Pick a product & color — AI writes the copy and renders a 1080×1080 poster.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Canvas */}
        <div className="card flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
          <div
            className="overflow-hidden rounded-2xl shadow-pop"
            style={{ width: DISPLAY, height: DISPLAY }}
          >
            <canvas ref={canvasElRef} />
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="card p-5">
            <label className="label">Product</label>
            <select
              className="input"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <div className="mt-4">
              <label className="label">Brand color</label>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            <div className="mt-4">
              <label className="label">Style</label>
              <StyleToggle value={style} onChange={setStyle} />
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <label className="label mb-0">AI Copy</label>
              {aiSource === "fallback" && (
                <span className="pill bg-amber-50 text-amber-600">offline</span>
              )}
              {aiSource === "ai" && (
                <span className="pill bg-emerald-50 text-emerald-600">AI</span>
              )}
            </div>
            <button
              onClick={generateCopy}
              disabled={generating}
              className="btn-accent mt-3 w-full"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generating ? "Generating…" : "Generate copy"}
            </button>
            {copy && (
              <div className="mt-4 space-y-2 text-sm">
                <p className="font-semibold text-ink">{copy.tagline}</p>
                <p className="text-muted">{copy.caption}</p>
                <div className="flex flex-wrap gap-1.5">
                  {copy.hashtags.map((h) => (
                    <span key={h} className="pill bg-slate-100 text-slate-600">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={exportPoster} disabled={exporting} className="btn-primary w-full">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? "Exporting…" : "Export PNG"}
          </button>

          {posterUrl && (
            <Link
              href={`/scheduler?productId=${productId}&poster=${encodeURIComponent(posterUrl)}`}
              className="btn-ghost w-full"
            >
              <CalendarClock className="h-4 w-4" /> Schedule this poster
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
