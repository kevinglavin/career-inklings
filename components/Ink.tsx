import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send, MessageSquarePlus, ExternalLink } from 'lucide-react';
import { BRAND_COLORS } from '../constants';
import { useT } from '../i18n';

// Context sent with each request (ink-build-spec "Context sent with each request").
export interface InkContext {
  app_language: 'en' | 'es';
  screen: 'landing' | 'mode_select' | 'swiping' | 'results';
  current_card?: { id: string; title: string };
  results?: {
    interest_code: string;
    scores: Record<string, { raw: number; pct: number }>;
    liked_ids: string[];
    unsure_ids: string[];
    liked_titles: string[];
    unsure_titles: string[];
  };
}

interface InkMessage { role: 'user' | 'assistant'; content: string; }

interface InkProps {
  open: boolean;
  onClose: () => void;
  context: InkContext;
  // CareerVerse handoff, only when a verified slug exists for the top occupation.
  careerVerse?: { title: string; url: string } | null;
}

const MAX_USER_CHARS = 1000;

export const Ink: React.FC<InkProps> = ({ open, onClose, context, careerVerse }) => {
  const { t } = useT();
  const [messages, setMessages] = useState<InkMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const on = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // Focus the input on open; trap Tab; Escape closes.
  useEffect(() => {
    if (!open) return;
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === 'Tab' && panelRef.current) {
        const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])'))
          .filter(el => !el.hasAttribute('disabled'));
        if (!nodes.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { clearTimeout(focusTimer); document.removeEventListener('keydown', onKeyDown); };
  }, [open, onClose]);

  // Auto-scroll to the newest message.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, open]);

  const send = async () => {
    const content = input.trim();
    if (!content || loading) return;
    const next = [...messages, { role: 'user' as const, content }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/.netlify/functions/ink-chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-24), context }),
      });
      const data = await res.json().catch(() => ({} as any));
      const text = data && typeof data.text === 'string' && data.text ? data.text : t('ink.error');
      setMessages(m => [...m, { role: 'assistant', content: text }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: t('ink.error') }]);
    } finally {
      setLoading(false);
    }
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Slide from the right on desktop, up from the bottom on mobile.
  const panelVariants = isDesktop
    ? { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } }
    : { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };

  const panelClass = isDesktop
    ? 'fixed inset-y-0 right-0 z-[60] flex w-[360px] max-w-full flex-col bg-white shadow-2xl'
    : 'fixed inset-x-0 bottom-0 z-[60] flex h-[70vh] flex-col rounded-t-3xl bg-white shadow-2xl';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop: dims + closes on mobile; on desktop stays click-through so the app is usable beside the panel. */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className={`fixed inset-0 z-[55] ${isDesktop ? 'pointer-events-none bg-transparent' : 'bg-black/40'}`}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal={!isDesktop}
            aria-label={t('ink.title')}
            variants={panelVariants}
            initial="initial" animate="animate" exit="exit"
            transition={{ type: 'tween', duration: 0.25 }}
            drag={isDesktop ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_e, info) => { if (!isDesktop && info.offset.y > 120) onClose(); }}
            className={panelClass}
          >
            {/* Mobile drag handle */}
            {!isDesktop && (
              <div className="flex justify-center pt-2 pb-1" aria-label={t('ink.dragHandle')}>
                <div className="h-1.5 w-10 rounded-full bg-gray-300" />
              </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ backgroundColor: BRAND_COLORS.blue }}>
              <img src="/ink.png" alt="" width={32} height={32} className="object-contain" />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-sm font-black text-white">{t('ink.title')}</p>
                <p className="text-[11px] text-white/80">{t('ink.subtitle')}</p>
              </div>
              <button onClick={() => setMessages([])} aria-label={t('ink.newChat')} title={t('ink.newChat')}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25">
                <MessageSquarePlus className="h-4 w-4 text-white" />
              </button>
              <button onClick={onClose} aria-label={t('ink.close')}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25">
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#f6f9f6] p-4">
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-sm leading-relaxed text-gray-700 shadow-sm">
                  {t('ink.greeting')}
                </div>
              </div>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                      m.role === 'user' ? 'rounded-tr-sm text-gray-900' : 'rounded-tl-sm bg-white text-gray-700'
                    }`}
                    style={m.role === 'user' ? { backgroundColor: BRAND_COLORS.lightBlue } : undefined}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start" role="status" aria-live="polite">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white px-3 py-2.5 shadow-sm">
                    <span className="sr-only">{t('ink.typing')}</span>
                    {[0, 1, 2].map(d => (
                      <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-gray-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CareerVerse CTA (only with a verified slug) */}
            {careerVerse && (
              <a href={careerVerse.url} target="_blank" rel="noopener noreferrer"
                className="mx-4 mb-2 flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-bold"
                style={{ borderColor: BRAND_COLORS.orange, color: BRAND_COLORS.blue }}>
                <span className="min-w-0">
                  <span className="block truncate">{t('ink.careerverseCta', { occupation: careerVerse.title })}</span>
                  <span className="block truncate text-[11px] font-medium text-gray-500">{t('ink.careerverseBody')}</span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0" />
              </a>
            )}

            {/* Composer */}
            <div className="flex items-end gap-2 border-t border-gray-100 p-3 shrink-0 bg-white">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value.slice(0, MAX_USER_CHARS))}
                onKeyDown={onInputKeyDown}
                rows={1}
                maxLength={MAX_USER_CHARS}
                placeholder={t('ink.placeholder')}
                className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                aria-label={t('ink.send')}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40"
                style={{ backgroundColor: BRAND_COLORS.orange }}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Header launcher button. Rendered in each screen's top bar.
export const InkTrigger: React.FC<{ onClick: () => void; size?: number; className?: string }> = ({ onClick, size = 28, className = '' }) => {
  const { t } = useT();
  return (
    <button onClick={onClick} aria-label={t('ink.open')}
      className={`flex h-11 w-11 items-center justify-center rounded-full ${className}`}>
      <img src="/ink.png" alt="" width={size} height={size} className="object-contain" />
    </button>
  );
};
