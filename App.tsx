import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { RotateCcw, Volume2, VolumeX, Trophy, ThumbsUp, ThumbsDown, Home } from 'lucide-react';
import { OCCUPATIONS, BRAND_COLORS, DEFAULT_PACK_ID, resolvePackImageUrl } from './constants';
import { AppStage, Occupation, Scores, RiasecType } from './types';
import { SwipeCard, SwipeCardHandle } from './components/SwipeCard';
import { LoginView, CompassLogo } from './components/LoginView';
import { InstructionsView } from './components/InstructionsView';
// Heavy views (recharts, jsPDF) are code-split so they stay out of the initial bundle.
// If a chunk fails to load (offline, or a stale hash after a redeploy), reload once to
// fetch the fresh index.html + chunks instead of showing a blank screen.
const lazyWithReload = <T extends React.ComponentType<any>>(importer: () => Promise<{ default: T }>) =>
  lazy(() => importer().catch(() => { window.location.reload(); return new Promise<{ default: T }>(() => {}); }));
const ResultsView = lazyWithReload(() => import('./components/ResultsView').then(m => ({ default: m.ResultsView })));
const SettingsView = lazyWithReload(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));
import { getOccupations, saveOccupations } from './db';
import { useT } from './i18n';

const INITIAL_SCORES: Scores = {
  [RiasecType.Realistic]: 0,
  [RiasecType.Investigative]: 0,
  [RiasecType.Artistic]: 0,
  [RiasecType.Social]: 0,
  [RiasecType.Enterprising]: 0,
  [RiasecType.Conventional]: 0,
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// --- MILESTONE BREAKPOINTS --- (toast text comes from i18n: t('milestone.' + n))
const MILESTONES = [10, 20, 30, 40, 50, 55];

// --- AUDIO ENGINE (Web Audio API - no files needed) ---
class SwipeAudio {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private getContext(): AudioContext {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // On mobile the context can start 'suspended' until a user gesture; resume so the
    // first swipe sound reliably plays (no-op if already running).
    if (this.ctx.state === 'suspended') { this.ctx.resume().catch(() => {}); }
    return this.ctx;
  }
  playSwipeRight() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
    } catch (e) { /* silent */ }
  }
  playSwipeLeft() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
    } catch (e) { /* silent */ }
  }
  playMilestone() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
        osc.start(ctx.currentTime + i * 0.1); osc.stop(ctx.currentTime + i * 0.1 + 0.3);
      });
    } catch (e) { /* silent */ }
  }
}
const swipeAudio = new SwipeAudio();

// --- STORAGE KEYS ---
const STORAGE_KEYS = {
  stage: 'cc_stage', currentIndex: 'cc_currentIndex', scores: 'cc_scores',
  swipeHistory: 'cc_swipeHistory', deckOrder: 'cc_deckOrder',
  soundEnabled: 'cc_soundEnabled', userName: 'cc_userName', imagePack: 'cc_imagePack',
};

// localStorage can throw (quota exceeded, Safari private mode, disabled storage).
// Persistence is a nice-to-have, so failures must never crash the running quiz.
const safeSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
const safeRemove = (k: string) => { try { localStorage.removeItem(k); } catch { /* ignore */ } };

// --- MAIN APP COMPONENT ---
export default function App() {
  const [deck, setDeck] = useState<Occupation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<Scores>({ ...INITIAL_SCORES });
  const [swipeHistory, setSwipeHistory] = useState<Array<{ index: number; direction: 'left' | 'right'; category: RiasecType }>>([]);
  const [likedCards, setLikedCards] = useState<Occupation[]>([]);
  const [stage, setStage] = useState<AppStage>(AppStage.Login);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [userName, setUserName] = useState('');
  const [imagePack, setImagePack] = useState<string>(DEFAULT_PACK_ID);
  const [lastSwipeDirection, setLastSwipeDirection] = useState<'left' | 'right'>('right');
  const { t } = useT();

  const [milestoneNum, setMilestoneNum] = useState<number | null>(null);
  const milestoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<SwipeCardHandle>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const initDeck = async () => {
      setIsLoading(true);
      try {
        const customOccupations = await getOccupations();
        const baseData = customOccupations && customOccupations.length > 0 ? customOccupations : OCCUPATIONS;
        const savedStage = localStorage.getItem(STORAGE_KEYS.stage) as AppStage | null;
        const savedIndex = localStorage.getItem(STORAGE_KEYS.currentIndex);
        const savedScores = localStorage.getItem(STORAGE_KEYS.scores);
        const savedHistory = localStorage.getItem(STORAGE_KEYS.swipeHistory);
        const savedDeckOrder = localStorage.getItem(STORAGE_KEYS.deckOrder);
        const savedSound = localStorage.getItem(STORAGE_KEYS.soundEnabled);
        const savedName = localStorage.getItem(STORAGE_KEYS.userName);

        if (savedSound !== null) { const enabled = savedSound === 'true'; setSoundEnabled(enabled); swipeAudio.enabled = enabled; }
        if (savedName) setUserName(savedName);
        const savedPack = localStorage.getItem(STORAGE_KEYS.imagePack);
        if (savedPack) setImagePack(savedPack);

        if (savedStage && savedDeckOrder && savedIndex !== null) {
          try {
            const orderIds: string[] = JSON.parse(savedDeckOrder);
            const orderedDeck = orderIds.map(id => baseData.find(o => o.id === id)).filter(Boolean) as Occupation[];
            const idx = parseInt(savedIndex, 10);
            // Only restore if the saved deck still maps cleanly (no card added/removed since)
            // and the index is sane; otherwise fall through to a fresh shuffle.
            if (orderedDeck.length > 0 && orderedDeck.length === orderIds.length && Number.isFinite(idx) && idx >= 0 && idx <= orderedDeck.length) {
              setDeck(orderedDeck); setCurrentIndex(idx);
              if (savedScores) setScores(JSON.parse(savedScores));
              if (savedHistory) {
                const history = JSON.parse(savedHistory);
                setSwipeHistory(history);
                // Rebuild likedCards from history + deck
                const liked = history
                  .filter((h: any) => h.direction === 'right')
                  .map((h: any) => orderedDeck[h.index])
                  .filter(Boolean);
                setLikedCards(liked);
              }
              setStage(savedStage); setIsLoading(false); return;
            }
          } catch (e) { console.warn('Failed to restore session, starting fresh'); }
        }
        setDeck(shuffleArray(baseData));
      } catch (err) { console.error('Failed to load occupations:', err); setDeck(shuffleArray(OCCUPATIONS)); }
      setIsLoading(false);
    };
    initDeck();
  }, []);

  // --- PERSIST SESSION ---
  useEffect(() => {
    if (deck.length === 0) return;
    safeSet(STORAGE_KEYS.stage, stage);
    safeSet(STORAGE_KEYS.currentIndex, String(currentIndex));
    safeSet(STORAGE_KEYS.scores, JSON.stringify(scores));
    safeSet(STORAGE_KEYS.swipeHistory, JSON.stringify(swipeHistory));
    safeSet(STORAGE_KEYS.deckOrder, JSON.stringify(deck.map(o => o.id)));
  }, [stage, currentIndex, scores, swipeHistory, deck]);

  // --- IMAGE PRELOADING ---
  useEffect(() => {
    if (stage !== AppStage.Swipe || deck.length === 0) return;
    [1, 2].forEach(offset => {
      const nextIdx = currentIndex + offset;
      if (nextIdx < deck.length && deck[nextIdx]?.imageUrl) { const img = new Image(); img.src = resolvePackImageUrl(deck[nextIdx].imageUrl, imagePack); }
    });
  }, [currentIndex, deck, stage, imagePack]);

  // --- KEYBOARD NAVIGATION ---
  useEffect(() => {
    if (stage !== AppStage.Swipe) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); handleSwipe('right'); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); handleSwipe('left'); }
      else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleUndo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, currentIndex, deck, scores, swipeHistory]);

  // --- MILESTONE CHECK ---
  const checkMilestone = useCallback((cardNumber: number) => {
    if (MILESTONES.includes(cardNumber)) {
      swipeAudio.playMilestone();
      setMilestoneNum(cardNumber);
      if (milestoneTimerRef.current) clearTimeout(milestoneTimerRef.current);
      milestoneTimerRef.current = setTimeout(() => setMilestoneNum(null), 2500);
    }
  }, []);

  // --- SWIPE HANDLER ---
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (currentIndex >= deck.length) return;
    const card = deck[currentIndex];
    setLastSwipeDirection(direction);
    if (navigator.vibrate) navigator.vibrate(50);
    if (direction === 'right') { swipeAudio.playSwipeRight(); } else { swipeAudio.playSwipeLeft(); }
    if (direction === 'right') {
      setScores(prev => ({ ...prev, [card.category]: prev[card.category] + 1 }));
      setLikedCards(prev => [...prev, card]);
    }
    setSwipeHistory(prev => [...prev, { index: currentIndex, direction, category: card.category }]);
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    checkMilestone(nextIndex);
    if (nextIndex >= deck.length) { setTimeout(() => setStage(AppStage.Results), 400); }
  }, [currentIndex, deck, checkMilestone]);

  // --- UNDO HANDLER ---
  const handleUndo = useCallback(() => {
    if (swipeHistory.length === 0) return;
    const lastAction = swipeHistory[swipeHistory.length - 1];
    if (lastAction.direction === 'right') {
      setScores(prev => ({ ...prev, [lastAction.category]: Math.max(0, prev[lastAction.category] - 1) }));
      setLikedCards(prev => prev.slice(0, -1));
    }
    setSwipeHistory(prev => prev.slice(0, -1));
    setCurrentIndex(lastAction.index);
    if (stage === AppStage.Results) setStage(AppStage.Swipe);
  }, [swipeHistory, stage]);

  // --- SOUND TOGGLE ---
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => { const next = !prev; swipeAudio.enabled = next; safeSet(STORAGE_KEYS.soundEnabled, String(next)); return next; });
  }, []);

  // --- IMAGE PACK SELECTION ---
  const handlePackChange = useCallback((packId: string) => {
    setImagePack(packId);
    safeSet(STORAGE_KEYS.imagePack, packId);
  }, []);

  // --- EXIT TO START (returns to the landing screen; progress is preserved) ---
  const handleExitToStart = useCallback(() => { setStage(AppStage.Login); }, []);

  // --- STAGE TRANSITIONS ---
  const handleLogin = (asAdmin: boolean, name?: string) => {
    if (name) { setUserName(name); safeSet(STORAGE_KEYS.userName, name); }
    if (asAdmin) { setStage(AppStage.Settings); } else { setStage(AppStage.Instructions); }
  };

  const handleStartSwiping = () => {
    if (currentIndex === 0 && swipeHistory.length === 0) setDeck(shuffleArray(deck));
    setStage(AppStage.Swipe);
  };

  const handleRestart = () => {
    setScores({ ...INITIAL_SCORES }); setSwipeHistory([]); setLikedCards([]); setCurrentIndex(0);
    setDeck(shuffleArray(deck)); setUserName('');
    safeRemove(STORAGE_KEYS.stage); safeRemove(STORAGE_KEYS.currentIndex);
    safeRemove(STORAGE_KEYS.scores); safeRemove(STORAGE_KEYS.swipeHistory);
    safeRemove(STORAGE_KEYS.deckOrder); safeRemove(STORAGE_KEYS.userName);
    setStage(AppStage.Login);
  };

  const handleEditResponses = () => {
    // Go back to swipe view so user can undo and re-swipe
    setStage(AppStage.Swipe);
  };

  const handleSettingsBack = () => { setStage(AppStage.Login); };

  const handleOccupationUpdate = async (id: string, updates: Partial<Occupation>) => {
    const updatedDeck = deck.map(occ => occ.id === id ? { ...occ, ...updates } : occ);
    setDeck(updatedDeck);
    try { await saveOccupations(updatedDeck); } catch (e) { console.error('Failed to save occupation update:', e); }
  };

  const handleSettingsReset = async () => {
    setDeck(shuffleArray(OCCUPATIONS));
    try { await saveOccupations(OCCUPATIONS); } catch (e) { console.error('Failed to reset occupations:', e); }
  };

  const progress = deck.length > 0 ? (currentIndex / deck.length) * 100 : 0;

  // --- EXIT ANIMATION VARIANTS (direction-aware) ---
  const cardExitVariants = {
    exit: {
      x: lastSwipeDirection === 'right' ? 300 : -300,
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.3 }
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ backgroundColor: BRAND_COLORS.blue }}>
        <div className="text-center">
          <CompassLogo size={64} className="mx-auto mb-4 animate-pulse" />
          <p className="text-white/70 text-sm font-medium">{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100 overflow-hidden">
      <div className="relative w-full max-w-md h-full max-h-[900px] bg-white shadow-2xl overflow-hidden flex flex-col">

        {stage === AppStage.Login && <LoginView onLogin={handleLogin} />}
        {stage === AppStage.Instructions && <InstructionsView onStart={handleStartSwiping} isLoading={false} imagePack={imagePack} onPackChange={handlePackChange} soundEnabled={soundEnabled} onToggleSound={toggleSound} />}
        {(stage === AppStage.Settings || stage === AppStage.Results) && (
          <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><CompassLogo size={48} className="animate-pulse" /></div>}>
            {stage === AppStage.Settings && (
              <SettingsView occupations={deck} onUpdate={handleOccupationUpdate} onReset={handleSettingsReset} onBack={handleSettingsBack} imagePack={imagePack} onPackChange={handlePackChange} />
            )}
            {stage === AppStage.Results && (
              <ResultsView scores={scores} onRestart={handleRestart} onEditResponses={handleEditResponses}
                totalCards={deck.length} userName={userName} swipeHistory={swipeHistory} deck={deck} likedCards={likedCards} />
            )}
          </Suspense>
        )}

        {/* === SWIPE VIEW === */}
        {stage === AppStage.Swipe && (
          <div className="flex flex-col h-full" role="main">
            <h1 className="sr-only">{t('app.swipeTitle')}</h1>
            {/* -- TOP BAR -- */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0 z-30 bg-white">
              <div className="flex items-center gap-2">
                <button onClick={handleExitToStart} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label={t('common.exitToStart')}>
                  <Home className="w-4 h-4 text-gray-600" />
                </button>
                <CompassLogo size={28} />
                <span className="text-sm font-bold text-gray-800">Inklings</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={toggleSound} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label={soundEnabled ? t('app.mute') : t('app.unmute')}>
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-gray-600" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
                </button>
                <button onClick={handleUndo} disabled={swipeHistory.length === 0}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label={t('app.undo')}>
                  <RotateCcw className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* -- PROGRESS BAR -- */}
            <div className="px-4 pb-2 shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500" role="status" aria-live="polite">{currentIndex} {t('app.of')} {deck.length}</span>
                <span className="text-xs font-medium text-gray-500">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: BRAND_COLORS.blue }}
                  initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3, ease: 'easeOut' }} />
              </div>
            </div>

            {/* -- CARD STACK -- */}
            <div className="flex-1 relative px-4 overflow-hidden" style={{ touchAction: 'none' }}>
              <AnimatePresence custom={lastSwipeDirection} mode="popLayout">
                {currentIndex < deck.length && (
                  <SwipeCard
                    key={deck[currentIndex].id}
                    ref={cardRef}
                    data={deck[currentIndex]}
                    onSwipe={handleSwipe}
                    index={currentIndex}
                    total={deck.length}
                    packId={imagePack}
                  />
                )}
              </AnimatePresence>
              {currentIndex + 1 < deck.length && (
                <div className="absolute top-2 left-6 right-6 h-full bg-gray-100 rounded-3xl -z-10 opacity-60" />
              )}
              {currentIndex + 2 < deck.length && (
                <div className="absolute top-4 left-8 right-8 h-full bg-gray-200 rounded-3xl -z-20 opacity-30" />
              )}
            </div>

            {/* -- THUMBS UP / DOWN BUTTONS -- */}
            {currentIndex < deck.length && (
              <div className="flex items-center justify-center gap-8 py-3 px-4 shrink-0 bg-white">
                <button
                  onClick={() => { if (cardRef.current) cardRef.current.triggerSwipe('left'); }}
                  className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center hover:bg-red-100 active:scale-90 transition-all shadow-sm"
                  aria-label={t('common.dislike')}
                >
                  <ThumbsDown className="w-7 h-7 text-red-500" />
                </button>
                <button
                  onClick={() => { if (cardRef.current) cardRef.current.triggerSwipe('right'); }}
                  className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center hover:bg-green-100 active:scale-90 transition-all shadow-sm"
                  aria-label={t('common.like')}
                >
                  <ThumbsUp className="w-7 h-7 text-green-500" />
                </button>
              </div>
            )}

            {/* -- MILESTONE TOAST -- */}
            <AnimatePresence>
              {milestoneNum !== null && (
                <motion.div initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }} className="absolute bottom-24 left-4 right-4 z-50 pointer-events-none">
                  <div className="flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl mx-auto max-w-sm"
                    style={{ backgroundColor: BRAND_COLORS.blue }} role="status" aria-live="polite">
                    <Trophy className="w-6 h-6 text-yellow-400 shrink-0" />
                    <span className="text-white font-semibold text-sm">{t('milestone.' + milestoneNum)}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
    </MotionConfig>
  );
}
