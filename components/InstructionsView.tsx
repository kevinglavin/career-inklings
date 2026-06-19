import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, BookOpen, X } from 'lucide-react';
import { BRAND_COLORS, SELECTABLE_PACKS, OCCUPATIONS, resolvePackImageUrl, defaultImageUrl } from '../constants';
import { CompassLogo } from './LoginView';
import { useT } from '../i18n';

interface InstructionsViewProps {
  onStart: () => void;
  isLoading: boolean;
  imagePack: string;
  onPackChange: (packId: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

// Three representative cards used to preview the chosen art style.
const SAMPLE_IDS = ['r1', 'r2', 'r4']; // Chef, Firefighter, Pilot
const SAMPLE_OCCS = SAMPLE_IDS.map(id => OCCUPATIONS.find(o => o.id === id)).filter(Boolean) as typeof OCCUPATIONS;

// Better Thumbs Up SVG - clean, modern, filled
const ThumbUpIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="22" fill="#DEF7EC"/>
    <path d="M15 26v8a1 1 0 001 1h2a1 1 0 001-1v-8a1 1 0 00-1-1h-2a1 1 0 00-1 1zm5-1.5c0-1 .7-1.8 1.6-2l3.2-.6c.5-.1.9-.4 1.1-.8l2-4a1.5 1.5 0 012.8.4l.3 1.6c.2.8-.1 1.7-.7 2.2l-1.3 1.2h4.5c1.1 0 2 .9 2 2v.5c0 .5-.2 1-.5 1.4.3.4.5.9.5 1.4v.2c0 .6-.2 1.1-.6 1.5.2.4.3.8.3 1.3v.2c0 .6-.3 1.2-.7 1.6.1.3.2.6.2.9v.2c0 1.1-.9 2-2 2H23c-1.7 0-3-1.3-3-3v-4.5z" fill="#059669"/>
  </svg>
);

const ThumbDownIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="22" fill="#FEE2E2"/>
    <path d="M33 22v-8a1 1 0 00-1-1h-2a1 1 0 00-1 1v8a1 1 0 001 1h2a1 1 0 001-1zm-5 1.5c0 1-.7 1.8-1.6 2l-3.2.6c-.5.1-.9.4-1.1.8l-2 4a1.5 1.5 0 01-2.8-.4l-.3-1.6c-.2-.8.1-1.7.7-2.2l1.3-1.2H14.5c-1.1 0-2-.9-2-2v-.5c0-.5.2-1 .5-1.4-.3-.4-.5-.9-.5-1.4v-.2c0-.6.2-1.1.6-1.5-.2-.4-.3-.8-.3-1.3v-.2c0-.6.3-1.2.7-1.6-.1-.3-.2-.6-.2-.9v-.2c0-1.1.9-2 2-2H25c1.7 0 3 1.3 3 3v4.5z" fill="#DC2626"/>
  </svg>
);

export const InstructionsView: React.FC<InstructionsViewProps> = ({ onStart, isLoading, imagePack, onPackChange, soundEnabled, onToggleSound }) => {
  const { t } = useT();
  const [showTutorial, setShowTutorial] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const tutorialSteps = [t('tutorial.step1'), t('tutorial.step2'), t('tutorial.step3'), t('tutorial.step4'), t('tutorial.step5')];

  // Accessible modal: move focus in, trap Tab, close on Escape, restore focus on close.
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
    <div className="flex flex-col h-full bg-white overflow-y-auto no-scrollbar">
      <div className="flex flex-col px-6 sm:px-8 pt-6 sm:pt-10 pb-6 flex-1">

        {/* Header */}
        <div className="flex items-center justify-center gap-2.5 mb-6 sm:mb-8 shrink-0">
          <CompassLogo size={32} />
          <div>
            <span className="font-bold text-lg" style={{ color: BRAND_COLORS.blue }}>Inklings</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-4 shrink-0">
          <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: BRAND_COLORS.black }}>{t('instr.title')}</h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
            {t('instr.subtitle')}
          </p>
        </div>

        {/* Tutorial link */}
        <div className="flex justify-center mb-6 shrink-0">
          <button
            ref={triggerRef}
            onClick={() => setShowTutorial(true)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-2 transition-colors"
            style={{ color: BRAND_COLORS.blue }}
          >
            <BookOpen className="w-4 h-4" />
            {t('instr.tutorial')}
          </button>
        </div>

        {/* Instruction Cards */}
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 shrink-0">

          {/* Step 1 - Like */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-green-100 bg-green-50/50">
            <ThumbUpIcon size={48} />
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-sm">{t('instr.right')}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('instr.rightSub')}</p>
            </div>
          </div>

          {/* Step 2 - Pass */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-red-100 bg-red-50/50">
            <ThumbDownIcon size={48} />
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-sm">{t('instr.left')}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('instr.leftSub')}</p>
            </div>
          </div>

          {/* Step 3 - Tap */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-blue-100 bg-blue-50/50">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${BRAND_COLORS.blue}15` }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 18c3.3 0 6-2.7 6-6s-2.7-6-6-6-6 2.7-6 6 2.7 6 6 6zm0-10c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4 1.8-4 4-4z" fill={BRAND_COLORS.blue} opacity="0.3"/>
                <circle cx="12" cy="12" r="2" fill={BRAND_COLORS.blue}/>
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke={BRAND_COLORS.blue} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-sm">{t('instr.tap')}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('instr.tapSub')}</p>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex justify-center gap-6 mb-6 sm:mb-8 shrink-0">
          <div className="text-center">
            <p className="text-2xl font-black" style={{ color: BRAND_COLORS.blue }}>60</p>
            <p className="text-xs text-gray-500 font-medium">{t('instr.careers')}</p>
          </div>
          <div className="w-px bg-gray-200"></div>
          <div className="text-center">
            <p className="text-2xl font-black" style={{ color: BRAND_COLORS.red }}>6</p>
            <p className="text-xs text-gray-500 font-medium">{t('instr.categories')}</p>
          </div>
          <div className="w-px bg-gray-200"></div>
          <div className="text-center">
            <p className="text-2xl font-black" style={{ color: BRAND_COLORS.lightBlue }}>1</p>
            <p className="text-xs text-gray-500 font-medium">{t('instr.uniqueYou')}</p>
          </div>
        </div>

        {/* Audio choice */}
        <div className="mb-6 sm:mb-8 shrink-0">
          <button
            onClick={onToggleSound}
            className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 active:scale-[0.99] transition-transform"
            aria-pressed={soundEnabled}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: soundEnabled ? `${BRAND_COLORS.blue}15` : '#f3f4f6' }}>
                {soundEnabled
                  ? <Volume2 className="w-5 h-5" style={{ color: BRAND_COLORS.blue }} />
                  : <VolumeX className="w-5 h-5 text-gray-500" />}
              </div>
              <p className="font-bold text-gray-800 text-sm text-left">{t('instr.audio')}</p>
            </div>
            {/* Toggle pill */}
            <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors`} style={{ backgroundColor: soundEnabled ? BRAND_COLORS.blue : '#d1d5db' }}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${soundEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </span>
          </button>
        </div>

        {/* Pick your card style */}
        <div className="mb-6 sm:mb-8 shrink-0">
          <p className="text-center text-sm font-bold text-gray-700 mb-1">{t('instr.pickStyle')}</p>
          <p className="text-center text-xs text-gray-500 mb-3">{t('instr.pickStyleSub')}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {SELECTABLE_PACKS.map(pack => {
              const active = imagePack === pack.id;
              return (
                <button
                  key={pack.id}
                  onClick={() => onPackChange(pack.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all active:scale-95 ${active ? 'text-white' : 'text-gray-600 bg-white border-gray-200 hover:border-gray-300'}`}
                  style={active ? { backgroundColor: BRAND_COLORS.blue, borderColor: BRAND_COLORS.blue } : undefined}
                  aria-pressed={active}
                >
                  {pack.label}
                </button>
              );
            })}
          </div>

          {/* 3-card sample preview of the selected style */}
          <p className="text-center text-xs text-gray-500 mt-4 mb-2">{t('instr.sampleHint')}</p>
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {SAMPLE_OCCS.map(occ => (
              <div key={occ.id} className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-[3/4]">
                <img
                  src={resolvePackImageUrl(occ.imageUrl, imagePack)}
                  alt={occ.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.currentTarget;
                    const fallback = defaultImageUrl(occ.imageUrl);
                    if (img.src !== fallback) img.src = fallback;
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-auto shrink-0 space-y-2">
          <button
            onClick={onStart}
            disabled={isLoading}
            className="w-full py-4 text-white rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ backgroundColor: BRAND_COLORS.red }}
          >
            {isLoading ? t('instr.loading') : t('instr.go')}
          </button>
          <p className="text-center text-xs text-gray-500">{t('instr.keyboard')}</p>
        </div>
      </div>

      {/* Tutorial modal */}
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
              <button onClick={() => setShowTutorial(false)} aria-label="Close" className="p-1 rounded-full hover:bg-gray-100">
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
