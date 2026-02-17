import React, { useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, ScriptOutputDigest } from '../types';
import { useStore } from '../store';
import { t } from '../i18n';
import { Button } from './ui/Button';

interface DigestPreviewDialogProps {
  card: Card | null;
  onClose: () => void;
}

export const DigestPreviewDialog: React.FC<DigestPreviewDialogProps> = ({ card, onClose }) => {
  const language = useStore((state) => state.language);
  const tr = (key: string, params?: Record<string, string | number>) => t(language, key, params);
  const payload = (card?.runtimeData?.payload as ScriptOutputDigest | undefined) ?? undefined;

  const markdown = useMemo(() => {
    if (!payload || payload.items.length === 0) return '';
    return payload.items
      .map((item, index) => {
        const title = item.title || tr('digest.untitledItem', { index: index + 1 });
        return `## ${title}\n\n${item.body}`;
      })
      .join('\n\n---\n\n');
  }, [payload, tr]);

  useEffect(() => {
    if (!card) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [card, onClose]);

  if (!card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {tr('digest.previewTitle', { cardTitle: card.title })}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{tr('digest.previewSubtitle')}</p>
          </div>
          <Button variant="ghost" size="icon" data-sound="none" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <div className="max-h-[70vh] overflow-auto px-5 py-4">
          {!payload || payload.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tr('common.noData')}</p>
          ) : (
            <div className="text-sm leading-7 text-foreground/95">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="text-xl font-semibold mt-1 mb-3">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-semibold mt-5 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2">{children}</h3>,
                  p: ({ children }) => <p className="mb-3 text-sm leading-7 whitespace-pre-wrap">{children}</p>,
                  ul: ({ children }) => <ul className="mb-3 list-disc pl-6 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-3 list-decimal pl-6 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-sm leading-7">{children}</li>,
                  hr: () => <hr className="my-5 border-border" />,
                  blockquote: ({ children }) => (
                    <blockquote className="my-3 border-l-4 border-border pl-3 text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-primary underline underline-offset-2"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  code: ({ className, children }) => {
                    const isBlock = Boolean(className?.includes('language-'));
                    if (!isBlock) {
                      return (
                        <code className="rounded bg-secondary/70 px-1 py-0.5 text-xs text-foreground">
                          {children}
                        </code>
                      );
                    }
                    return <code className={className}>{children}</code>;
                  },
                  pre: ({ children }) => (
                    <pre className="my-3 overflow-x-auto rounded-md border border-border bg-secondary/35 p-3 text-xs leading-6">
                      {children}
                    </pre>
                  ),
                }}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
