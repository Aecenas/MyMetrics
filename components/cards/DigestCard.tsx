import React from 'react';
import { Card, ScriptOutputDigest } from '../../types';
import { useStore } from '../../store';
import { t } from '../../i18n';

interface DigestCardProps {
  card: Card;
  onOpenPreview?: () => void;
}

export const DigestCard: React.FC<DigestCardProps> = ({ card, onOpenPreview }) => {
  const language = useStore((state) => state.language);
  const tr = (key: string, params?: Record<string, string | number>) => t(language, key, params);
  const payload = card.runtimeData?.payload as ScriptOutputDigest | undefined;
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  const measureOverflow = React.useCallback(() => {
    const node = contentRef.current;
    if (!node) {
      setIsOverflowing(false);
      return;
    }
    setIsOverflowing(node.scrollHeight - node.clientHeight > 1);
  }, []);

  React.useEffect(() => {
    measureOverflow();
  }, [measureOverflow, payload, card.ui_config.size, card.runtimeData?.lastUpdated]);

  React.useEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    if (typeof ResizeObserver === 'undefined') {
      const handleResize = () => measureOverflow();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    const observer = new ResizeObserver(() => measureOverflow());
    observer.observe(node);
    return () => observer.disconnect();
  }, [measureOverflow]);

  if (!payload || payload.items.length === 0) {
    return <div className="text-sm text-muted-foreground">{tr('common.noData')}</div>;
  }

  return (
    <div className="relative h-full min-h-0">
      <div
        ref={contentRef}
        className={`h-full overflow-hidden pr-1 space-y-3 ${isOverflowing ? 'cursor-zoom-in' : ''}`}
        onDoubleClick={() => {
          if (!isOverflowing) return;
          onOpenPreview?.();
        }}
      >
        {payload.items.map((item, index) => (
          <article key={`${index}-${item.title}`} className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground/95 leading-snug">
              {item.title || tr('digest.untitledItem', { index: index + 1 })}
            </h4>
            <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap break-words">
              {item.body}
            </p>
          </article>
        ))}
      </div>

      {isOverflowing && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card via-card/90 to-transparent"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-1.5 flex justify-center">
            <span className="rounded-full border border-border/70 bg-card/90 px-2 py-0.5 text-[11px] text-muted-foreground">
              {tr('digest.doubleClickHint')}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
