import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { RotateCcw, Volume2, VolumeX, Trophy, ThumbsUp, ThumbsDown, Home, HelpCircle } from 'lucide-react';
import { OCCUPATIONS, BRAND_COLORS, DEFAULT_PACK_ID, resolvePackImageUrl } from './constants';
import { AppStage, DeckPreferences, Occupation, ResponseChoice, Scores, SwipeResponse, RiasecType } from './types';
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
import { clearOccupations, getOccupations, saveOccupations } from './db';
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

const pickQuickDeck = (occupations: Occupation[], perType = 4): Occupation[] => {
  const picked: Occupation[] = [];
  const seen = new Set<string>();
  Object.values(RiasecType).forEach(type => {
    shuffleArray(occupations.filter(o => o.category === type)).slice(0, perType).forEach(card => {
      picked.push(card);
      seen.add(card.id);
    });
  });
  if (picked.length < perType * Object.values(RiasecType).length) {
    shuffleArray(occupations).forEach(card => {
      if (picked.length >= perType * Object.values(RiasecType).length) return;
      if (!seen.has(card.id)) picked.push(card);
    });
  }
  return shuffleArray(picked);
};

const buildPreferredQuickDeck = (occupations: Occupation[], preferredTypes: Set<RiasecType>, target = 24): Occupation[] => {
  if (preferredTypes.size === 0) return pickQuickDeck(occupations);

  const selected: Occupation[] = [];
  const seen = new Set<string>();
  const pushUnique = (cards: Occupation[], limit: number) => {
    for (const card of cards) {
      if (selected.length >= target || limit <= 0) break;
      if (seen.has(card.id)) continue;
      selected.push(card);
      seen.add(card.id);
      limit--;
    }
  };

  const preferred = Object.values(RiasecType).filter(type => preferredTypes.has(type));
  const perPreferred = preferred.length <= 3 ? 5 : 4;
  preferred.forEach(type => pushUnique(shuffleArray(occupations.filter(o => o.category === type)), perPreferred));

  const pools = Object.values(RiasecType)
    .filter(type => !preferredTypes.has(type))
    .map(type => shuffleArray(occupations.filter(o => o.category === type)));
  let cursor = 0;
  while (selected.length < target && pools.some(pool => pool.length > 0)) {
    const pool = pools[cursor % pools.length];
    const next = pool.shift();
    if (next && !seen.has(next.id)) {
      selected.push(next);
      seen.add(next.id);
    }
    cursor++;
  }

  pushUnique(shuffleArray(occupations), target - selected.length);
  return shuffleArray(selected);
};

const buildDeckFromPreferences = (
  occupations: Occupation[],
  mode: 'quick' | 'full',
  preferences?: DeckPreferences,
): Occupation[] => {
  const preferredTypes = new Set(preferences?.preferredTypes || []);
  const avoidedTypes = new Set(preferences?.avoidedTypes || []);
  const filtered = occupations.filter(card => !avoidedTypes.has(card.category));
  const source = filtered.length >= 10 ? filtered : occupations;

  if (mode === 'quick') return buildPreferredQuickDeck(source, preferredTypes);

  if (preferredTypes.size === 0) return shuffleArray(source);
  const preferred = shuffleArray(source.filter(card => preferredTypes.has(card.category)));
  const rest = shuffleArray(source.filter(card => !preferredTypes.has(card.category)));
  return [...preferred, ...rest];
};

const countByType = (liked: Occupation[], maybe: Occupation[]): Scores => {
  const next = { ...INITIAL_SCORES };
  liked.forEach(card => { next[card.category] += 1; });
  maybe.forEach(card => { next[card.category] += 0.45; });
  return next;
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
  likedCardIds: 'cc_likedCardIds', maybeCardIds: 'cc_maybeCardIds',
  resultTotalCards: 'cc_resultTotalCards', answeredCount: 'cc_answeredCount',
  responseCountsByType: 'cc_responseCountsByType',
};

// localStorage can throw (quota exceeded, Safari private mode, disabled storage).
// Persistence is a nice-to-have, so failures must never crash the running quiz.
const safeSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
const safeRemove = (k: string) => { try { localStorage.removeItem(k); } catch { /* ignore */ } };

// --- MAIN APP COMPONENT ---
export default function App() {
  const [baseDeck, setBaseDeck] = useState<Occupation[]>([]);
  const [deck, setDeck] = useState<Occupation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<Scores>({ ...INITIAL_SCORES });
  const [swipeHistory, setSwipeHistory] = useState<SwipeResponse[]>([]);
  const [likedCards, setLikedCards] = useState<Occupation[]>([]);
  const [maybeCards, setMaybeCards] = useState<Occupation[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [resultTotalCards, setResultTotalCards] = useState(0);
  const [responseCountsByType, setResponseCountsByType] = useState<Scores>({ ...INITIAL_SCORES });
  const [stage, setStage] = useState<AppStage>(AppStage.Login);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [userName, setUserName] = useState('');
  const [imagePack, setImagePack] = useState<string>(DEFAULT_PACK_ID);
  const [lastSwipeDirection, setLastSwipeDirection] = useState<ResponseChoice>('right');
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
        setBaseDeck(baseData);
        const savedStage = localStorage.getItem(STORAGE_KEYS.stage) as AppStage | null;
        const savedIndex = localStorage.getItem(STORAGE_KEYS.currentIndex);
        const savedScores = localStorage.getItem(STORAGE_KEYS.scores);
        const savedHistory = localStorage.getItem(STORAGE_KEYS.swipeHistory);
        const savedDeckOrder = localStorage.getItem(STORAGE_KEYS.deckOrder);
        const savedSound = localStorage.getItem(STORAGE_KEYS.soundEnabled);
        const savedName = localStorage.getItem(STORAGE_KEYS.userName);
        const savedLikedIds = localStorage.getItem(STORAGE_KEYS.likedCardIds);
        const savedMaybeIds = localStorage.getItem(STORAGE_KEYS.maybeCardIds);
        const savedResultTotal = localStorage.getItem(STORAGE_KEYS.resultTotalCards);
        const savedAnsweredCount = localStorage.getItem(STORAGE_KEYS.answeredCount);
        const savedTypeCounts = localStorage.getItem(STORAGE_KEYS.responseCountsByType);

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
              if (savedResultTotal) {
                const total = parseInt(savedResultTotal, 10);
                if (Number.isFinite(total) && total > 0) setResultTotalCards(total);
              } else {
                setResultTotalCards(orderedDeck.length);
              }
              if (savedAnsweredCount) {
                const count = parseInt(savedAnsweredCount, 10);
                if (Number.isFinite(count) && count >= 0) setAnsweredCount(count);
              }
              if (savedTypeCounts) setResponseCountsByType({ ...INITIAL_SCORES, ...JSON.parse(savedTypeCounts) });
              if (savedHistory) {
                const history = JSON.parse(savedHistory);
                setSwipeHistory(history);
                // Rebuild likedCards from history + deck
                const liked = savedLikedIds
                  ? JSON.parse(savedLikedIds).map((id: string) => baseData.find(o => o.id === id)).filter(Boolean)
                  : history
                    .filter((h: any) => h.direction === 'right')
                    .map((h: any) => orderedDeck[h.index])
                    .filter(Boolean);
                const maybe = savedMaybeIds
                  ? JSON.parse(savedMaybeIds).map((id: string) => baseData.find(o => o.id === id)).filter(Boolean)
                  : history
                    .filter((h: any) => h.direction === 'maybe')
                    .map((h: any) => orderedDeck[h.index])
                    .filter(Boolean);
                setLikedCards(liked);
                setMaybeCards(maybe);
                if (!savedScores) setScores(countByType(liked, maybe));
              }
              setStage(savedStage); setIsLoading(false); return;
            }
          } catch (e) { console.warn('Failed to restore session, starting fresh'); }
        }
        setDeck(shuffleArray(baseData));
      } catch (err) { console.error('Failed to load occupations:', err); setBaseDeck(OCCUPATIONS); setDeck(shuffleArray(OCCUPATIONS)); }
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
    safeSet(STORAGE_KEYS.likedCardIds, JSON.stringify(likedCards.map(o => o.id)));
    safeSet(STORAGE_KEYS.maybeCardIds, JSON.stringify(maybeCards.map(o => o.id)));
    safeSet(STORAGE_KEYS.resultTotalCards, String(resultTotalCards || deck.length));
    safeSet(STORAGE_KEYS.answeredCount, String(resultTotalCards > 0 ? Math.min(answeredCount, resultTotalCards) : answeredCount));
    safeSet(STORAGE_KEYS.responseCountsByType, JSON.stringify(responseCountsByType));
  }, [stage, currentIndex, scores, swipeHistory, deck, likedCards, maybeCards, resultTotalCards, answeredCount, responseCountsByType]);

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
      else if (e.key === 'ArrowUp') { e.preventDefault(); handleSwipe('maybe'); }
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
  const handleSwipe = useCallback((direction: ResponseChoice) => {
    if (currentIndex >= deck.length) return;
    const card = deck[currentIndex];
    setLastSwipeDirection(direction);
    if (navigator.vibrate) navigator.vibrate(50);
    if (direction === 'right' || direction === 'maybe') { swipeAudio.playSwipeRight(); } else { swipeAudio.playSwipeLeft(); }
    if (direction === 'right') {
      setScores(prev => ({ ...prev, [card.category]: prev[card.category] + 1 }));
      setLikedCards(prev => [...prev, card]);
    } else if (direction === 'maybe') {
      setScores(prev => ({ ...prev, [card.category]: prev[card.category] + 0.45 }));
      setMaybeCards(prev => [...prev, card]);
    }
    setSwipeHistory(prev => [...prev, { index: currentIndex, direction, category: card.category, weight: direction === 'right' ? 1 : direction === 'maybe' ? 0.45 : 0 }]);
    setAnsweredCount(prev => prev + 1);
    setResponseCountsByType(prev => ({ ...prev, [card.category]: prev[card.category] + 1 }));
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
    } else if (lastAction.direction === 'maybe') {
      setScores(prev => ({ ...prev, [lastAction.category]: Math.max(0, prev[lastAction.category] - 0.45) }));
      setMaybeCards(prev => prev.slice(0, -1));
    }
    setSwipeHistory(prev => prev.slice(0, -1));
    setAnsweredCount(prev => Math.max(0, prev - 1));
    setResponseCountsByType(prev => ({ ...prev, [lastAction.category]: Math.max(0, prev[lastAction.category] - 1) }));
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

  const handleStartSwiping = (mode: 'quick' | 'full' = 'full', preferences?: DeckPreferences) => {
    const source = baseDeck.length ? baseDeck : deck;
    const nextDeck = buildDeckFromPreferences(source, mode, preferences);
    setDeck(nextDeck);
    setResultTotalCards(nextDeck.length);
    setAnsweredCount(0);
    setResponseCountsByType({ ...INITIAL_SCORES });
    setScores({ ...INITIAL_SCORES });
    setSwipeHistory([]);
    setLikedCards([]);
    setMaybeCards([]);
    setCurrentIndex(0);
    setStage(AppStage.Swipe);
  };

  const handleRestart = () => {
    setScores({ ...INITIAL_SCORES }); setSwipeHistory([]); setLikedCards([]); setMaybeCards([]); setCurrentIndex(0);
    setAnsweredCount(0); setResultTotalCards(0); setResponseCountsByType({ ...INITIAL_SCORES });
    setDeck(shuffleArray(baseDeck.length ? baseDeck : deck)); setUserName('');
    safeRemove(STORAGE_KEYS.stage); safeRemove(STORAGE_KEYS.currentIndex);
    safeRemove(STORAGE_KEYS.scores); safeRemove(STORAGE_KEYS.swipeHistory);
    safeRemove(STORAGE_KEYS.deckOrder); safeRemove(STORAGE_KEYS.userName);
    safeRemove(STORAGE_KEYS.likedCardIds); safeRemove(STORAGE_KEYS.maybeCardIds);
    safeRemove(STORAGE_KEYS.resultTotalCards); safeRemove(STORAGE_KEYS.answeredCount);
    safeRemove(STORAGE_KEYS.responseCountsByType);
    setStage(AppStage.Login);
  };

  const handleClearLocalData = async () => {
    const freshDeck = shuffleArray(OCCUPATIONS);
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith('cc_'))
        .forEach(safeRemove);
    } catch {
      Object.values(STORAGE_KEYS).forEach(safeRemove);
      safeRemove('cc_favoriteCareers');
      safeRemove('cc_careerNotes');
      safeRemove('cc_lang');
    }

    try { await clearOccupations(); } catch (e) { console.error('Failed to clear local deck customizations:', e); }

    setBaseDeck(OCCUPATIONS);
    setDeck(freshDeck);
    setScores({ ...INITIAL_SCORES });
    setSwipeHistory([]);
    setLikedCards([]);
    setMaybeCards([]);
    setAnsweredCount(0);
    setResultTotalCards(0);
    setResponseCountsByType({ ...INITIAL_SCORES });
    setCurrentIndex(0);
    setUserName('');
    setImagePack(DEFAULT_PACK_ID);
    setSoundEnabled(true);
    swipeAudio.enabled = true;
    setStage(AppStage.Login);
  };

  const handleFinishNow = () => {
    if (currentIndex > 0 || answeredCount > 0) setStage(AppStage.Results);
  };

  const handleRetakeType = (type: RiasecType) => {
    const source = baseDeck.length ? baseDeck : OCCUPATIONS;
    const typeCards = shuffleArray(source.filter(card => card.category === type));
    const previousTypeCount = responseCountsByType[type] || 0;
    const retakeSize = previousTypeCount > 0 ? previousTypeCount : Math.min(4, typeCards.length);
    const retakeDeck = typeCards.slice(0, retakeSize);
    if (retakeDeck.length === 0) return;
    const nextLiked = likedCards.filter(card => card.category !== type);
    const nextMaybe = maybeCards.filter(card => card.category !== type);
    const nextAnsweredBase = Math.max(0, answeredCount - previousTypeCount);
    const nextTotal = Math.max(0, (resultTotalCards || answeredCount || deck.length || source.length) - previousTypeCount + retakeDeck.length);

    setDeck(retakeDeck);
    setCurrentIndex(0);
    setLikedCards(nextLiked);
    setMaybeCards(nextMaybe);
    setScores(countByType(nextLiked, nextMaybe));
    setSwipeHistory([]);
    setAnsweredCount(Math.min(nextAnsweredBase, nextTotal || nextAnsweredBase));
    setResponseCountsByType(prev => ({ ...prev, [type]: 0 }));
    setResultTotalCards(nextTotal || retakeDeck.length);
    setStage(AppStage.Swipe);
  };

  const handleEditResponses = () => {
    // Go back to swipe view so user can undo and re-swipe
    setStage(AppStage.Swipe);
  };

  const handleSettingsBack = () => { setStage(AppStage.Login); };

  const handleOccupationUpdate = async (id: string, updates: Partial<Occupation>) => {
    const updatedDeck = deck.map(occ => occ.id === id ? { ...occ, ...updates } : occ);
    const updatedBaseDeck = (baseDeck.length ? baseDeck : deck).map(occ => occ.id === id ? { ...occ, ...updates } : occ);
    setDeck(updatedDeck);
    setBaseDeck(updatedBaseDeck);
    try { await saveOccupations(updatedBaseDeck); } catch (e) { console.error('Failed to save occupation update:', e); }
  };

  const handleSettingsReset = async () => {
    setBaseDeck(OCCUPATIONS);
    setDeck(shuffleArray(OCCUPATIONS));
    try { await saveOccupations(OCCUPATIONS); } catch (e) { console.error('Failed to reset occupations:', e); }
  };

  const progress = deck.length > 0 ? (currentIndex / deck.length) * 100 : 0;

  // --- EXIT ANIMATION VARIANTS (direction-aware) ---
  const cardExitVariants = {
    exit: {
      x: lastSwipeDirection === 'right' ? 300 : lastSwipeDirection === 'left' ? -300 : 0,
      y: lastSwipeDirection === 'maybe' ? -160 : 0,
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.3 }
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen h-[100dvh] w-screen flex items-center justify-center" style={{ backgroundColor: BRAND_COLORS.blue }}>
        <div className="text-center">
          <CompassLogo size={64} className="mx-auto mb-4 animate-pulse" />
          <p className="text-white/70 text-sm font-medium">{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="h-screen h-[100dvh] w-screen flex items-center justify-center bg-[#dfeceb] overflow-hidden">
      <div className="relative flex h-full min-h-0 w-full max-w-md flex-col overflow-hidden bg-[#f6f9f6] shadow-2xl sm:max-h-[900px]">

        {stage === AppStage.Login && <LoginView onLogin={handleLogin} onClearData={handleClearLocalData} />}
        {stage === AppStage.Instructions && <InstructionsView onStart={handleStartSwiping} isLoading={false} imagePack={imagePack} onPackChange={handlePackChange} soundEnabled={soundEnabled} onToggleSound={toggleSound} />}
        {(stage === AppStage.Settings || stage === AppStage.Results) && (
          <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><CompassLogo size={48} className="animate-pulse" /></div>}>
            {stage === AppStage.Settings && (
              <SettingsView occupations={deck} onUpdate={handleOccupationUpdate} onReset={handleSettingsReset} onBack={handleSettingsBack} imagePack={imagePack} onPackChange={handlePackChange} />
            )}
            {stage === AppStage.Results && (
              <ResultsView scores={scores} onRestart={handleRestart} onEditResponses={handleEditResponses}
                totalCards={resultTotalCards || deck.length} answeredCount={answeredCount} onRetakeType={handleRetakeType}
                userName={userName} swipeHistory={swipeHistory} deck={deck} likedCards={likedCards} maybeCards={maybeCards} onClearData={handleClearLocalData} />
            )}
          </Suspense>
        )}

        {/* === SWIPE VIEW === */}
        {stage === AppStage.Swipe && (
          <div className="flex flex-col h-full bg-[#f6f9f6]" role="main">
            <h1 className="sr-only">{t('app.swipeTitle')}</h1>
            {/* -- TOP BAR -- */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0 z-30 bg-[#f6f9f6]/95">
              <div className="flex items-center gap-2">
                <button onClick={handleExitToStart} className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
                  aria-label={t('common.exitToStart')}>
                  <Home className="w-4 h-4 text-gray-600" />
                </button>
                <CompassLogo size={28} />
                <span className="text-sm font-bold text-gray-800">Inklings</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={toggleSound} className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
                  aria-label={soundEnabled ? t('app.mute') : t('app.unmute')}>
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-gray-600" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
                </button>
                <button onClick={handleUndo} disabled={swipeHistory.length === 0}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label={t('app.undo')}>
                  <RotateCcw className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* -- PROGRESS BAR -- */}
            <div className="px-4 pb-2 shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500" role="status" aria-live="polite">{currentIndex} {t('app.of')} {deck.length}</span>
                <div className="flex items-center gap-3">
                  {currentIndex >= 12 && currentIndex < deck.length && (
                    <button onClick={handleFinishNow} className="text-xs font-bold underline underline-offset-2" style={{ color: BRAND_COLORS.blue }}>
                      {t('app.finishNow')}
                    </button>
                  )}
                  <span className="text-xs font-medium text-gray-500">{Math.round(progress)}%</span>
                </div>
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

            {/* -- RESPONSE BUTTONS -- */}
            {currentIndex < deck.length && (
              <div className="px-4 pt-3 pb-4 shrink-0 bg-[#f6f9f6]">
                <div className="flex items-center justify-center gap-5">
                  <button
                    onClick={() => { if (cardRef.current) cardRef.current.triggerSwipe('left'); }}
                    className="w-14 h-14 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center hover:bg-red-100 active:scale-90 transition-all shadow-sm"
                    aria-label={t('common.dislike')}
                  >
                    <ThumbsDown className="w-6 h-6 text-red-500" />
                  </button>
                  <button
                    onClick={() => { if (cardRef.current) cardRef.current.triggerSwipe('maybe'); }}
                    className="w-14 h-14 rounded-full bg-yellow-50 border-2 border-yellow-200 flex items-center justify-center hover:bg-yellow-100 active:scale-90 transition-all shadow-sm"
                    aria-label={t('common.maybe')}
                  >
                    <HelpCircle className="w-6 h-6 text-yellow-600" />
                  </button>
                  <button
                    onClick={() => { if (cardRef.current) cardRef.current.triggerSwipe('right'); }}
                    className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center hover:bg-green-100 active:scale-90 transition-all shadow-sm"
                    aria-label={t('common.like')}
                  >
                    <ThumbsUp className="w-6 h-6 text-green-500" />
                  </button>
                </div>
                {swipeHistory.length > 0 && (
                  <button onClick={handleUndo}
                    className="mt-3 mx-auto flex items-center gap-1.5 text-xs font-bold underline underline-offset-2"
                    style={{ color: BRAND_COLORS.blue }}>
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t('app.undoLastChoice')}
                  </button>
                )}
              </div>
            )}

            {/* -- MILESTONE TOAST -- */}
            <AnimatePresence>
              {milestoneNum !== null && (
                <motion.div initial={{ opacity: 0, y: -12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.96 }} className="absolute left-4 right-4 top-[76px] z-50 pointer-events-none">
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
