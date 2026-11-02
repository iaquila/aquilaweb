import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';

export type MarqueeTone = 'danger' | 'success' | 'info' | 'warning';

export interface LiveMarqueeItem {
  id: string;
  tag: string;
  text: string;
  meta?: string;
  tone: MarqueeTone;
}

interface LiveMarqueeProps {
  label: string;
  items: LiveMarqueeItem[];
  tone: MarqueeTone;
  ariaLabel: string;
  onItemClick?: (id: string) => void;
  className?: string;
}

const toneStyles: Record<
  MarqueeTone,
  { container: string; label: string; dot: string; tag: string }
> = {
  danger: {
    container: 'border-red-500/20 bg-red-500/[0.04]',
    label: 'border-red-500/30 bg-red-500/15 text-red-300',
    dot: 'bg-red-400',
    tag: 'text-red-300',
  },
  success: {
    container: 'border-emerald-500/20 bg-emerald-500/[0.04]',
    label: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
    dot: 'bg-emerald-400',
    tag: 'text-emerald-300',
  },
  info: {
    container: 'border-sky-500/20 bg-sky-500/[0.04]',
    label: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
    dot: 'bg-sky-400',
    tag: 'text-sky-300',
  },
  warning: {
    container: 'border-amber-500/20 bg-amber-500/[0.04]',
    label: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
    dot: 'bg-amber-400',
    tag: 'text-amber-300',
  },
};

export const LiveMarquee: React.FC<LiveMarqueeProps> = ({
  label,
  items,
  tone,
  ariaLabel,
  onItemClick,
  className = '',
}) => {
  const [duration, setDuration] = useState(20);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);
  const measureRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el || reduceMotion) return;

    const update = () => {
      const width = el.getBoundingClientRect().width;
      const viewportWidth = viewportRef.current?.getBoundingClientRect().width ?? 0;
      if (width > 0) {
        setDuration(Math.max(8, width / 40));
        setShouldScroll(width > viewportWidth + 1);
      }
    };

    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [items, reduceMotion]);

  if (items.length === 0) return null;

  const styles = toneStyles[tone];

  const renderPill = (item: LiveMarqueeItem, duplicate: boolean) => (
    <button
      key={`${item.id}-${duplicate ? 'dup' : 'src'}`}
      type="button"
      tabIndex={duplicate ? -1 : 0}
      onClick={() => onItemClick?.(item.id)}
      aria-label={`${item.tag}: ${item.text}`}
      className="mr-2 inline-flex max-w-[min(34rem,80vw)] shrink-0 items-center gap-1.5 rounded-full border border-[#1C2E24] bg-[#070C09]/80 px-2.5 py-1 text-[11px] transition hover:border-emerald-500/40"
    >
      <span
        className={`whitespace-nowrap text-[9px] font-black uppercase tracking-wider ${toneStyles[item.tone].tag}`}
      >
        {item.tag}
      </span>
      <span className="min-w-0 truncate text-[#94A89D]">{item.text}</span>
      {item.meta && (
        <span className="whitespace-nowrap text-[10px] font-bold text-[#718579]">
          {item.meta}
        </span>
      )}
      <ChevronRight className="h-3 w-3 shrink-0 text-[#718579]" />
    </button>
  );

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 ${styles.container} ${className}`}
      aria-label={ariaLabel}
      role="group"
    >
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${styles.label}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${styles.dot} animate-pulse`} />
        {label}
      </span>

      <div
        ref={viewportRef}
        className={`relative min-w-0 flex-1 ${
          shouldScroll && !reduceMotion ? 'overflow-hidden' : 'overflow-x-auto no-scrollbar'
        }`}
      >
        <div
          className={
            shouldScroll && !reduceMotion
              ? 'live-marquee-track flex w-max items-center py-0.5'
              : 'flex w-max items-center py-0.5'
          }
          style={
            shouldScroll && !reduceMotion
              ? ({ '--marquee-duration': `${duration}s` } as React.CSSProperties)
              : undefined
          }
        >
          <div ref={measureRef} className="flex shrink-0 items-center">
            {items.map((item) => renderPill(item, false))}
          </div>
          {shouldScroll && !reduceMotion && (
            <div aria-hidden="true" className="flex shrink-0 items-center">
              {items.map((item) => renderPill(item, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
