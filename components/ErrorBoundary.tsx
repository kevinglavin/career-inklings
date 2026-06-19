import React from 'react';
import { BRAND_COLORS } from '../constants';
import { useT } from '../i18n';
import { CompassLogo } from './LoginView';

// Localized fallback UI (rendered inside LanguageProvider, so hooks are available).
const ErrorFallback: React.FC = () => {
  const { t } = useT();
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[100dvh] bg-white px-8 text-center">
      <CompassLogo size={48} />
      <h1 className="mt-5 text-2xl font-black" style={{ color: BRAND_COLORS.black }}>{t('error.title')}</h1>
      <p className="mt-2 max-w-xs text-sm text-gray-500 leading-relaxed">{t('error.body')}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 px-6 py-3 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-[0.98]"
        style={{ backgroundColor: BRAND_COLORS.blue }}
      >
        {t('error.reload')}
      </button>
    </div>
  );
};

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Keep a diagnostic trail; progress is already persisted in localStorage.
    console.error('App error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) return <ErrorFallback />;
    return this.props.children;
  }
}
