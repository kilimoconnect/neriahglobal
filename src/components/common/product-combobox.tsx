"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category?: string | null;
  brand?: string | null;
  track_inventory?: boolean;
}

export function ProductCombobox({
  products,
  value,
  onSelect,
  stock,
  showStock = false,
  placeholder = "Search product…",
  className,
}: {
  products: ProductItem[];
  value: string;
  onSelect: (id: string) => void;
  /** product_id → available quantity (for sales). */
  stock?: Record<string, number>;
  showStock?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [rect, setRect] = React.useState<{ left: number; top: number; width: number } | null>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selected = products.find((p) => p.id === value) ?? null;
  const availOf = (p: ProductItem) => (stock ? stock[p.id] ?? 0 : 0);
  const outOfStock = (p: ProductItem) => showStock && p.track_inventory !== false && availOf(p) <= 0;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? products.filter((p) =>
          [p.sku, p.name, p.category ?? "", p.brand ?? ""].some((f) => f.toLowerCase().includes(q)),
        )
      : products;
    return list.slice(0, 100);
  }, [products, query]);

  function openMenu() {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      const width = Math.min(Math.max(r.width, 460), window.innerWidth - 24);
      const left = Math.min(r.left, window.innerWidth - width - 12);
      setRect({ left: Math.max(12, left), top: r.bottom + 4, width });
    }
    setQuery("");
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function pick(p: ProductItem) {
    if (outOfStock(p)) return;
    onSelect(p.id);
    setOpen(false);
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={cn(
          "flex h-8 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-2.5 text-left text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring",
          className,
        )}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? (
            <>
              <span className="font-mono text-xs">{selected.sku}</span>
              <span className="mx-1 text-muted-foreground">·</span>
              {selected.name}
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>

      {open && rect &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              className="fixed z-50 overflow-hidden rounded-md border border-border bg-popover shadow-lg"
              style={{ left: rect.left, top: rect.top, width: rect.width }}
            >
              <div className="flex items-center gap-2 border-b border-border px-3">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setOpen(false);
                    if (e.key === "Enter") {
                      const first = filtered.find((p) => !outOfStock(p));
                      if (first) pick(first);
                    }
                  }}
                  placeholder="Search by SKU, name, category or brand…"
                  className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <ul className="max-h-72 overflow-y-auto py-1">
                {filtered.length === 0 && (
                  <li className="px-3 py-6 text-center text-sm text-muted-foreground">No products match “{query}”.</li>
                )}
                {filtered.map((p) => {
                  const oos = outOfStock(p);
                  const avail = availOf(p);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        disabled={oos}
                        onClick={() => pick(p)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm",
                          oos ? "cursor-not-allowed opacity-50" : "hover:bg-accent focus:bg-accent focus:outline-none",
                          p.id === value && "bg-accent/60",
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">{p.sku}</span>
                            <span className="truncate font-medium">{p.name}</span>
                          </span>
                          {(p.category || p.brand) && (
                            <span className="block truncate text-xs text-muted-foreground">
                              {[p.category, p.brand].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </span>
                        {showStock && (
                          <span className={cn("shrink-0 whitespace-nowrap text-xs tabular-nums", oos ? "text-destructive" : "text-muted-foreground")}>
                            {p.track_inventory === false ? "non-stock" : oos ? "Out of stock" : `${avail} avail`}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
