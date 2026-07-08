import React, { useState } from 'react';
import { ArrowRight, Compass, Zap, Target, BarChart3 } from 'lucide-react';
import { BRAND_COLORS } from '../constants';
import { useT, LANGUAGES } from '../i18n';
import { LegalSupport } from './LegalSupport';
import { InkTrigger } from './Ink';

interface LoginViewProps {
  onLogin: (asAdmin: boolean, name?: string) => void;
  onClearData: () => void | Promise<void>;
  // INK-018: the demo editor is gated behind ?demo=1 and hidden from the public build.
  showCustomize?: boolean;
  onOpenInk?: () => void;
}

// Compass Logo Component - reusable across the app
export const CompassLogo = ({ size = 40, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Outer ring */}
    <circle cx="24" cy="24" r="22" stroke={BRAND_COLORS.blue} strokeWidth="2.5" fill="white"/>
    <circle cx="24" cy="24" r="19" stroke={BRAND_COLORS.lightBlue} strokeWidth="1" strokeDasharray="2 3" fill="none" opacity="0.5"/>
    {/* Cardinal markers */}
    <circle cx="24" cy="5" r="2" fill={BRAND_COLORS.orange}/>
    <circle cx="24" cy="43" r="1.5" fill={BRAND_COLORS.lightBlue}/>
    <circle cx="5" cy="24" r="1.5" fill={BRAND_COLORS.lightBlue}/>
    <circle cx="43" cy="24" r="1.5" fill={BRAND_COLORS.lightBlue}/>
    {/* Compass needle - North (red) */}
    <path d="M24 10L28 24L24 22L20 24Z" fill={BRAND_COLORS.orange}/>
    {/* Compass needle - South (blue) */}
    <path d="M24 38L20 24L24 26L28 24Z" fill={BRAND_COLORS.blue}/>
    {/* Center dot */}
    <circle cx="24" cy="24" r="3" fill={BRAND_COLORS.blue}/>
    <circle cx="24" cy="24" r="1.5" fill="white"/>
  </svg>
);

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onClearData, showCustomize = false, onOpenInk }) => {
  const [name, setName] = useState('');
  const { t, lang, setLang } = useT();
  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      
      {/* Background gradient shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-[0.07]" style={{ backgroundColor: BRAND_COLORS.lightBlue }}></div>
        <div className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full opacity-[0.05]" style={{ backgroundColor: BRAND_COLORS.blue }}></div>
        <div className="absolute top-1/3 -right-16 w-48 h-48 rounded-full opacity-[0.04]" style={{ backgroundColor: BRAND_COLORS.orange }}></div>
      </div>

      {/* Scrollable content wrapper - ensures everything is reachable */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar relative z-10">
        
        <div className="flex flex-col px-6 sm:px-8 pt-6 sm:pt-10 pb-6 flex-1">

          {/* Header - Logo + Admin */}
          <div className="flex justify-between items-center mb-6 sm:mb-8 shrink-0">
            <div className="flex items-center gap-2.5">
              <CompassLogo size={38} />
              <div>
                <span className="font-bold text-lg leading-none" style={{ color: BRAND_COLORS.blue }}>Inklings</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {onOpenInk && <InkTrigger onClick={onOpenInk} className="border border-gray-200 bg-white shadow-sm" />}
              <div className="flex min-h-11 items-center gap-0.5 rounded-full border border-gray-200 bg-gray-50 p-0.5" role="group" aria-label="Language">
                {LANGUAGES.map(l => (
                  <button key={l.code} onClick={() => setLang(l.code)}
                    className={`min-h-11 px-3 text-xs font-bold rounded-full transition-colors ${lang === l.code ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
                    style={lang === l.code ? { backgroundColor: BRAND_COLORS.blue } : undefined}
                    aria-pressed={lang === l.code}>
                    {l.label}
                  </button>
                ))}
              </div>
              {showCustomize && (
                <button
                  onClick={() => onLogin(true)}
                  className="inline-flex min-h-11 items-center px-2 text-xs font-medium text-gray-500 transition-colors hover:text-gray-700"
                  aria-label={t('admin.label')}
                >
                  {t('admin.label')}
                </button>
              )}
            </div>
          </div>

          {/* Hero Section */}
          <div className="mb-6 sm:mb-8 shrink-0">
            <h1 className="text-3xl sm:text-4xl font-black leading-[1.15] mb-3 tracking-tight" style={{ color: BRAND_COLORS.black }}>
              {t('login.title1')}
              <br/>
              <span style={{ color: BRAND_COLORS.orange }}>{t('login.title2')}</span>
            </h1>
            <p className="text-base text-gray-500 leading-relaxed max-w-sm">
              {t('login.tagline')}
            </p>
          </div>

          {/* Feature Cards - responsive grid */}
          <div className="grid grid-cols-3 gap-3 mb-6 sm:mb-8 shrink-0">
            <div className="bg-gray-50 rounded-2xl p-3 sm:p-4 text-center border border-gray-100">
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${BRAND_COLORS.orange}15` }}>
                <Zap className="w-5 h-5" style={{ color: BRAND_COLORS.orange }} />
              </div>
              <p className="text-xs font-semibold text-gray-700 leading-tight">{t('login.feat.assessment')}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3 sm:p-4 text-center border border-gray-100">
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${BRAND_COLORS.blue}15` }}>
                <Target className="w-5 h-5" style={{ color: BRAND_COLORS.blue }} />
              </div>
              <p className="text-xs font-semibold text-gray-700 leading-tight">{t('login.feat.model')}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3 sm:p-4 text-center border border-gray-100">
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${BRAND_COLORS.lightBlue}15` }}>
                <BarChart3 className="w-5 h-5" style={{ color: BRAND_COLORS.lightBlue }} />
              </div>
              <p className="text-xs font-semibold text-gray-700 leading-tight">{t('login.feat.report')}</p>
            </div>
          </div>

          {/* Visual Card Preview */}
          <div className="flex-1 min-h-[120px] max-h-[220px] mb-6 sm:mb-8 relative shrink">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Stacked card preview */}
              <div className="absolute w-[70%] max-w-[240px] h-[85%] rounded-2xl shadow-sm border border-gray-200 bg-gray-100 transform rotate-6 translate-x-4 opacity-40"></div>
              <div className="absolute w-[70%] max-w-[240px] h-[85%] rounded-2xl shadow-sm border border-gray-200 bg-gray-50 transform -rotate-3 -translate-x-2 opacity-60"></div>
              <div className="relative w-[70%] max-w-[240px] h-[85%] rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col" style={{ backgroundColor: BRAND_COLORS.blue }}>
                <div className="flex-1 bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center">
                  <CompassLogo size={64} />
                </div>
                <div className="px-3 pt-2 pb-3 text-center shrink-0">
                  <p className="text-white font-bold text-sm leading-tight">{t('login.cardPreview')}</p>
                  <p className="text-white/90 text-sm leading-tight mt-0.5">{t('login.cardCareers')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Area */}
          <div className="shrink-0 space-y-3 mt-auto">
            <label htmlFor="name-input" className="sr-only">{t('login.namePlaceholder')}</label>
            <input
              id="name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder={t('login.namePlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent text-base"
            />
            <button 
              onClick={() => onLogin(false, name.trim() || undefined)}
              className="group relative w-full py-4 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98] overflow-hidden"
              style={{ backgroundColor: BRAND_COLORS.blue }}
            >
              <span className="relative z-10 flex items-center justify-center">
                {t('login.start')} <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            <p className="text-center text-xs text-gray-400 font-medium">
              {t('login.note')}
            </p>
            <p className="text-center text-[11px] leading-snug text-gray-400 pb-2">
              {t('login.onetCredit')}
            </p>
            <LegalSupport onClearData={onClearData} />
          </div>
        </div>
      </div>
    </div>
  );
};
