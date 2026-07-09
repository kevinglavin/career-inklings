import React, { useEffect, useRef, useState } from 'react';
import { DatabaseZap, ExternalLink, LifeBuoy, ShieldCheck, Trash2, X } from 'lucide-react';
import { BRAND_COLORS } from '../constants';
import { useT } from '../i18n';

const SUPPORT_EMAIL = 'admin@createyourwhy.com';
const LAST_UPDATED = 'July 8, 2026';

type LegalTopic = 'privacy' | 'terms' | 'sources';

interface LegalSupportProps {
  onClearData?: () => void | Promise<void>;
  className?: string;
}

const TOPICS: Record<LegalTopic, { title: string; eyebrow: string; sections: { heading: string; body: string[] }[] }> = {
  privacy: {
    eyebrow: `Privacy notice - last updated ${LAST_UPDATED}`,
    title: 'Privacy Policy',
    sections: [
      {
        heading: 'What Inklings stores',
        body: [
          'Inklings is a client-only app. The app does not require an account and does not send quiz responses, notes, favorites, names, or results to Create Your Why while you use it.',
          'To keep the app useful on the same device, it may save your display name, language, card style, swipe progress, liked or curious careers, notes, favorites, sound setting, and local deck customizations in browser storage on this device.',
        ],
      },
      {
        heading: 'What leaves the device',
        body: [
          'When you chat with Ink, the in-app guide, your typed messages plus a little context (app language, current screen, the current card while swiping, and — on the results screen — your interest code, scores, and the occupations you liked or marked Unsure) are sent to Anthropic’s API to generate replies. Those messages are not stored by the app, and Ink is instructed never to ask for personal information.',
          'Career links open third-party sites such as O*NET OnLine in a new tab. Those sites have their own privacy practices.',
          `If you email support at ${SUPPORT_EMAIL}, you choose what information to include in that email.`,
        ],
      },
      {
        heading: 'Students and schools',
        body: [
          'Inklings is intended as an exploratory career-interest activity, not a school record system. Schools should review the app under their own student privacy, procurement, COPPA, FERPA, and parent/guardian consent processes before assigning it to students.',
          'Children under 13 should use the app only with parent, guardian, teacher, or school permission.',
        ],
      },
      {
        heading: 'Clearing local data',
        body: [
          'Use Clear local data to remove saved progress, name, notes, favorites, card style, language, and local deck customizations from this browser on this device.',
        ],
      },
    ],
  },
  terms: {
    eyebrow: `Terms - last updated ${LAST_UPDATED}`,
    title: 'Terms of Use',
    sections: [
      {
        heading: 'Use of the app',
        body: [
          'Inklings helps users explore career interests by reacting to occupation cards and reviewing a Holland/RIASEC-style summary.',
          'The app is provided for informational and educational exploration only. It is not career counseling, psychological testing, educational placement advice, employment advice, or a guarantee of fit for any career.',
        ],
      },
      {
        heading: 'User responsibility',
        body: [
          'Results depend on the cards selected, the responses given, and the data available in the app. Use results as a starting point for discussion, research, and reflection.',
          'Students, families, counselors, and schools should use professional judgment and additional context before making decisions about classes, programs, training, or careers.',
        ],
      },
      {
        heading: 'Availability and changes',
        body: [
          'The app may change over time, including card wording, images, reports, data sources, and features.',
          `Questions or support requests can be sent to ${SUPPORT_EMAIL}.`,
        ],
      },
    ],
  },
  sources: {
    eyebrow: 'Data sources and attribution',
    title: 'Sources & Attribution',
    sections: [
      {
        heading: 'O*NET',
        body: [
          'Occupation information, interest types, task examples, work activities, and career links are based in part on O*NET(R) data and O*NET OnLine resources.',
          'This application includes information from the O*NET Database by the U.S. Department of Labor, Employment and Training Administration. O*NET(R) is a trademark of USDOL/ETA.',
          'Create Your Why, LLC has modified and summarized some information for student-friendly use. USDOL/ETA has not approved, endorsed, or tested these modifications.',
        ],
      },
      {
        heading: 'External career links',
        body: [
          'Result cards and career shortlist items link to O*NET OnLine so users can continue research with the source career profile.',
        ],
      },
    ],
  },
};

export const LegalSupport: React.FC<LegalSupportProps> = ({ onClearData, className = '' }) => {
  const { t } = useT();
  const [activeTopic, setActiveTopic] = useState<LegalTopic | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [clearMessage, setClearMessage] = useState('');
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const activeContent = activeTopic ? TOPICS[activeTopic] : null;

  useEffect(() => {
    if (!activeTopic) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setActiveTopic(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      triggerRef.current?.focus();
    };
  }, [activeTopic]);

  const openTopic = (topic: LegalTopic) => {
    triggerRef.current = document.activeElement instanceof HTMLButtonElement ? document.activeElement : null;
    setActiveTopic(topic);
  };

  const handleClearData = async () => {
    if (!onClearData) return;
    const confirmed = window.confirm('Clear saved Inklings data from this browser on this device? This removes progress, name, notes, favorites, card style, language, and local deck customizations.');
    if (!confirmed) return;
    setIsClearing(true);
    setClearMessage('');
    try {
      await onClearData();
      setClearMessage('Local data cleared.');
    } catch {
      setClearMessage('Could not clear all local data. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className={`text-center ${className}`}>
      <p className="mx-auto mb-2 max-w-sm text-[11px] leading-relaxed text-gray-500">
        {t('legal.disclaimer')}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
        <button onClick={() => openTopic('privacy')} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-2 text-gray-600 hover:bg-gray-50">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t('legal.privacy')}
        </button>
        <button onClick={() => openTopic('terms')} className="min-h-11 rounded-full border border-gray-200 bg-white px-3 py-2 text-gray-600 hover:bg-gray-50">
          {t('legal.terms')}
        </button>
        <button onClick={() => openTopic('sources')} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-2 text-gray-600 hover:bg-gray-50">
          <DatabaseZap className="h-3.5 w-3.5" />
          {t('legal.sources')}
        </button>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-2 text-gray-600 hover:bg-gray-50">
          <LifeBuoy className="h-3.5 w-3.5" />
          {t('legal.support')}
        </a>
        {onClearData && (
          <button onClick={handleClearData} disabled={isClearing} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-red-100 bg-white px-3 py-2 text-red-600 hover:bg-red-50 disabled:opacity-60">
            <Trash2 className="h-3.5 w-3.5" />
            {isClearing ? t('legal.clearing') : t('legal.clearAll')}
          </button>
        )}
      </div>
      {clearMessage && <p className="mt-2 text-xs font-semibold text-gray-500" role="status">{clearMessage}</p>}

      {activeContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5" role="dialog" aria-modal="true" aria-labelledby="legal-title">
          <div className="flex max-h-full w-full max-w-md flex-col rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
              <div className="text-left">
                <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">{activeContent.eyebrow}</p>
                <h2 id="legal-title" className="mt-1 text-xl font-black text-gray-900">{activeContent.title}</h2>
              </div>
              <button ref={closeRef} onClick={() => setActiveTopic(null)} className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Close">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5 text-left">
              {activeContent.sections.map(section => (
                <section key={section.heading}>
                  <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: BRAND_COLORS.blue }}>{section.heading}</h3>
                  <div className="mt-2 space-y-2">
                    {section.body.map(paragraph => (
                      <p key={paragraph} className="text-sm leading-relaxed text-gray-600">{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
              {activeTopic === 'sources' && (
                <div className="grid grid-cols-1 gap-2">
                  <a href="https://www.onetonline.org/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">
                    {t('legal.onetOnline')} <ExternalLink className="h-4 w-4" />
                  </a>
                  <a href="https://www.onetcenter.org/database.html" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">
                    {t('legal.onetDatabase')} <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 p-4">
              <button onClick={() => setActiveTopic(null)} className="w-full rounded-2xl py-3 text-sm font-black text-white" style={{ backgroundColor: BRAND_COLORS.blue }}>
                {t('legal.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
