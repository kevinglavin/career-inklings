import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronDown, HeartPulse, Info, Palette, PanelsTopLeft, ThumbsDown, ThumbsUp, Volume2, VolumeX, X, Zap } from 'lucide-react';
import { BRAND_COLORS, OCCUPATIONS, SELECTABLE_PACKS, defaultImageUrl, resolvePackImageUrl } from '../constants';
import { CompassLogo } from './LoginView';
import { useT } from '../i18n';

interface InstructionsViewProps {
  onStart: (mode?: 'quick' | 'full') => void;
  isLoading: boolean;
  imagePack: string;
  onPackChange: (packId: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const PREVIEW_OCCUPATION = OCCUPATIONS.find(occupation => occupation.id === 's6') || OCCUPATIONS[0];

export const InstructionsView: React.FC<InstructionsViewProps> = ({ onStart, isLoading, imagePack, onPackChange, soundEnabled, onToggleSound }) => {
  const { t } = useT();
  const [showTutorial, setShowTutorial] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const activePack = SELECTABLE_PACKS.find(pack => pack.id === imagePack) || SELECTABLE_PACKS[0];
  const previewSrc = resolvePackImageUrl(PREVIEW_OCCUPATION.imageUrl, activePack.id);

  const tutorialSteps = [t('tutorial.step1'), t('tutorial.step2'), t('tutorial.step3'), t('tutorial.step4'), t('tutorial.step5'), t('tutorial.step6')];

  useEffect(() => {
    if (!showTutorial) return;
    const dialog = dialogRef.current;
    const focusables: HTMLElement[] = dialog
      ? Array.from(dialog.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])'))
      : [];
    focusables[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setShowTutorial(false); return; }
      if (e.key === 'Tab' && focusables.length) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      triggerRef.current?.focus();
    };
  }, [showTutorial]);

  return (
    <div className="instructions-root flex h-screen min-h-0 flex-col overflow-hidden bg-[#fbfcfd] text-[#06132a] supports-[height:100dvh]:h-[100dvh]">
      <div className="instructions-frame flex h-full min-h-0 flex-col overflow-hidden px-4 pb-[calc(0.4rem+env(safe-area-inset-bottom))] pt-2 min-[380px]:px-5 [@media(max-height:430px)]:pb-[calc(0.25rem+env(safe-area-inset-bottom))] [@media(max-height:430px)]:pt-1.5">
        <div className="instructions-header flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-3">
            <CompassLogo size={32} />
            <span className="instructions-brand-name text-[25px] font-black leading-none [@media(max-height:430px)]:text-[21px]" style={{ color: BRAND_COLORS.blue }}>Inklings</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              ref={triggerRef}
              onClick={() => setShowTutorial(true)}
              className="instructions-icon-button flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)] [@media(max-height:430px)]:h-9 [@media(max-height:430px)]:w-9"
              aria-label={t('instr.tutorial')}
            >
              <BookOpen className="h-5 w-5" style={{ color: BRAND_COLORS.blue }} />
            </button>
            <button
              onClick={onToggleSound}
              className="instructions-icon-button flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)] [@media(max-height:430px)]:h-9 [@media(max-height:430px)]:w-9"
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? t('app.mute') : t('app.unmute')}
            >
              {soundEnabled
                ? <Volume2 className="h-5 w-5" style={{ color: BRAND_COLORS.blue }} />
                : <VolumeX className="h-5 w-5 text-gray-500" />}
            </button>
          </div>
        </div>

        <section className="instructions-copy shrink-0 pt-2 text-center [@media(max-height:430px)]:pt-1">
          <h2 className="instructions-title text-[22px] font-black leading-[1.05] text-[#071327] min-[380px]:text-[24px] [@media(max-height:430px)]:text-[19px]">
            {t('instr.discoverTitle')}
          </h2>
          <p className="instructions-subtitle mx-auto mt-1 max-w-[350px] text-[13px] font-medium leading-[1.2] text-[#65708b] min-[380px]:text-[14px] [@media(max-height:520px)]:hidden">
            {t('instr.discoverBody')}
          </p>
        </section>

        <section className="instructions-preview-card mt-2 flex min-h-0 flex-[1_1_auto] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.10)] [@media(max-height:430px)]:mt-1 [@media(max-height:430px)]:rounded-[16px]">
          <div className="instructions-preview-media relative min-h-0 flex-[1_1_auto] overflow-hidden bg-[#edf4f6]">
            <img
              key={previewSrc}
              src={previewSrc}
              alt={`Emergency Nurse preview in ${activePack.label} style`}
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.dataset.fallback) {
                  img.dataset.fallback = '1';
                  img.src = defaultImageUrl(PREVIEW_OCCUPATION.imageUrl);
                }
              }}
              className="h-full w-full object-cover"
              style={{ objectPosition: 'top center' }}
            />
          </div>

          <div className="instructions-preview-body shrink-0 bg-white px-4 pb-2 pt-2 [@media(max-height:430px)]:px-3 [@media(max-height:430px)]:py-1.5">
            <div className="flex shrink-0 items-start gap-3 [@media(max-height:430px)]:gap-2">
              <div className="instructions-career-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-[0_8px_18px_rgba(0,56,77,0.18)] [@media(max-height:430px)]:h-9 [@media(max-height:430px)]:w-9 [@media(max-height:430px)]:rounded-xl" style={{ backgroundColor: BRAND_COLORS.blue }}>
                <HeartPulse className="h-6 w-6 text-white [@media(max-height:430px)]:h-5 [@media(max-height:430px)]:w-5" />
              </div>
              <div className="min-w-0 text-left">
                <h3 className="instructions-career-title text-[21px] font-black leading-tight text-[#071327] min-[380px]:text-[23px] [@media(max-height:430px)]:text-[18px]">{t('instr.nurseTitle')}</h3>
                <p className="instructions-career-copy mt-0.5 text-[13px] font-medium leading-snug text-[#65708b] min-[380px]:text-[14px] [@media(max-height:430px)]:text-[12px] [@media(max-height:430px)]:leading-tight">
                  {t('instr.nurseBody')}
                </p>
              </div>
            </div>

            <div className="instructions-reaction-grid mt-2 grid shrink-0 grid-cols-3 gap-2 [@media(max-height:430px)]:mt-1.5 [@media(max-height:430px)]:gap-1.5">
              <button
                type="button"
                className="instructions-reaction flex min-h-[52px] flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/60 text-red-500 [@media(max-height:430px)]:min-h-[42px] [@media(max-height:430px)]:rounded-xl"
                aria-label={t('instr.dislike')}
              >
                <ThumbsDown className="h-5 w-5" />
                <span className="mt-1 text-xs font-black min-[380px]:text-sm">{t('instr.dislike')}</span>
              </button>
              <button
                type="button"
                className="instructions-reaction flex min-h-[52px] flex-col items-center justify-center rounded-2xl border border-yellow-100 bg-yellow-50/80 text-yellow-700 [@media(max-height:430px)]:min-h-[42px] [@media(max-height:430px)]:rounded-xl"
                aria-label={t('instr.unsure')}
              >
                <span className="text-2xl font-black leading-none [@media(max-height:430px)]:text-xl">?</span>
                <span className="mt-1 text-xs font-black min-[380px]:text-sm">{t('instr.unsure')}</span>
              </button>
              <button
                type="button"
                className="instructions-reaction flex min-h-[52px] flex-col items-center justify-center rounded-2xl border border-green-100 bg-green-50/70 text-green-600 [@media(max-height:430px)]:min-h-[42px] [@media(max-height:430px)]:rounded-xl"
                aria-label={t('instr.like')}
              >
                <ThumbsUp className="h-5 w-5" />
                <span className="mt-1 text-xs font-black min-[380px]:text-sm">{t('instr.like')}</span>
              </button>
            </div>
          </div>
        </section>

        <div className="instructions-note mt-2 flex shrink-0 items-center justify-center gap-2 text-center text-[13px] font-medium leading-snug text-[#65708b] [@media(max-height:620px)]:hidden">
          <Info className="h-4 w-4 shrink-0" />
          <p>{t('instr.tapAny')}</p>
        </div>

        <div className="instructions-actions mt-2 shrink-0 space-y-1.5 [@media(max-height:430px)]:mt-1.5 [@media(max-height:430px)]:space-y-1">
          <button
            onClick={() => onStart('quick')}
            disabled={isLoading}
            className="instructions-primary flex w-full items-center justify-center gap-2.5 rounded-[18px] px-3 py-2.5 text-[16px] font-black text-white shadow-[0_10px_22px_rgba(0,56,77,0.20)] transition-transform active:scale-[0.98] disabled:opacity-50 min-[380px]:text-[17px] [@media(max-height:430px)]:py-2 [@media(max-height:430px)]:text-[15px]"
            style={{ backgroundColor: BRAND_COLORS.blue }}
          >
            <Zap className="h-5 w-5 fill-white" />
            <span className="min-w-0 leading-tight">{isLoading ? t('instr.loading') : t('instr.quickMode')}</span>
          </button>

          <button
            onClick={() => onStart('full')}
            disabled={isLoading}
            className="instructions-secondary flex w-full items-center justify-center gap-2.5 rounded-[18px] border-2 bg-white px-3 py-2 text-[15px] font-black transition-transform active:scale-[0.98] disabled:opacity-50 min-[380px]:text-[16px] [@media(max-height:430px)]:text-[14px]"
            style={{ borderColor: BRAND_COLORS.blue, color: '#071327' }}
          >
            <PanelsTopLeft className="h-5 w-5" style={{ color: BRAND_COLORS.blue }} />
            <span className="min-w-0 leading-tight">{t('instr.fullJourney')}</span>
          </button>

          <div className="instructions-style-picker overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
            <button
              type="button"
              onClick={() => setStyleOpen(open => !open)}
              className="flex w-full items-center justify-between gap-2.5 px-4 py-2.5 text-left"
              aria-expanded={styleOpen}
            >
              <span className="flex min-w-0 items-center gap-2.5 text-[15px] font-black text-[#071327] min-[380px]:text-[16px]">
                <Palette className="h-5 w-5 shrink-0" style={{ color: BRAND_COLORS.blue }} />
                <span className="min-w-0 truncate"><span className="font-black">{t('instr.style')}</span> {activePack.label}</span>
              </span>
              <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${styleOpen ? 'rotate-180' : ''}`} />
            </button>
            {styleOpen && (
              <div className="grid grid-cols-2 gap-2 border-t border-gray-100 p-3">
                {SELECTABLE_PACKS.map(pack => {
                  const active = activePack.id === pack.id;
                  return (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => { onPackChange(pack.id); setStyleOpen(false); }}
                      className={`rounded-2xl border px-3 py-2.5 text-xs font-black ${active ? 'text-white' : 'border-gray-200 bg-white text-gray-600'}`}
                      style={active ? { backgroundColor: BRAND_COLORS.blue, borderColor: BRAND_COLORS.blue } : undefined}
                      aria-pressed={active}
                    >
                      {pack.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showTutorial && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
          onClick={() => setShowTutorial(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            ref={dialogRef}
            className="w-full max-w-sm max-h-full overflow-y-auto no-scrollbar bg-white rounded-3xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black" style={{ color: BRAND_COLORS.black }}>{t('tutorial.title')}</h3>
              <button onClick={() => setShowTutorial(false)} aria-label={t('tutorial.closeLabel')} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <ol className="space-y-3">
              {tutorialSteps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold shrink-0" style={{ backgroundColor: BRAND_COLORS.blue }}>{i + 1}</span>
                  <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
            <button
              onClick={() => setShowTutorial(false)}
              className="mt-6 w-full py-3 text-white rounded-2xl font-bold transition-all active:scale-[0.98]"
              style={{ backgroundColor: BRAND_COLORS.red }}
            >
              {t('tutorial.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
