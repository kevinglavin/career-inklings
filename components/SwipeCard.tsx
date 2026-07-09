import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Undo2, Info, ListChecks, Activity, ExternalLink, Volume2 } from 'lucide-react';
import { Occupation, ResponseChoice } from '../types';
import { RIASEC_COLORS, BRAND_COLORS, contrastText, resolvePackImageUrl, defaultImageUrl } from '../constants';
import { useT } from '../i18n';
import { localizeOccupation } from '../occupations.es';
import { speak, speechSupported } from '../speech';

export interface SwipeCardHandle {
  triggerSwipe: (direction: ResponseChoice) => void;
}

interface SwipeCardProps {
  data: Occupation;
  onSwipe: (direction: ResponseChoice) => void;
  index: number;
  total: number;
  packId: string;
}

// Chunky thumbs icons for swipe overlay
const ChunkyThumbsUp = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg filter">
    <path d="M7 11V19C7 20.1046 6.10457 21 5 21H4C2.89543 21 2 20.1046 2 19V12C2 10.8954 2.89543 10 4 10H7ZM7 11H12.5C13.8807 11 15 9.88071 15 8.5V6C15 4.89543 15.8954 4 17 4C17.7403 4 18.3879 4.40919 18.7324 5.01183C19.1415 5.72776 19.068 6.64931 18.8055 7.43679L17.8055 10.4368C17.652 10.8973 18.0028 11.3636 18.4877 11.3636H19.5C20.8807 11.3636 22 12.4829 22 13.8636V15.8636C22 16.1824 21.9213 16.4859 21.7801 16.7601L20.3515 19.6172C19.7891 20.742 18.6366 21.4545 17.3794 21.4545H11C9.89543 21.4545 9 20.5591 9 19.4545V13L7 11Z" fill="#22C55E" />
  </svg>
);

const ChunkyThumbsDown = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg filter">
    <path d="M17 13V5C17 3.89543 17.8954 3 19 3H20C21.1046 3 22 3.89543 22 5V12C22 13.1046 21.1046 14 20 14H17ZM17 13H11.5C10.1193 13 9 14.1193 9 15.5V18C9 19.1046 8.10457 20 7 20C6.2597 20 5.61213 19.5908 5.26761 18.9882C4.85848 18.2722 4.93198 17.3507 5.19451 16.5632L6.19451 13.5632C6.34796 13.1027 5.99723 12.6364 5.51227 12.6364H4.5C3.11929 12.6364 2 11.5171 2 10.1364V8.13636C2 7.81762 2.07872 7.51408 2.21987 7.23995L3.64853 4.38281C4.2109 3.25805 5.36337 2.54545 6.62061 2.54545H13C14.1046 2.54545 15 3.44089 15 4.54545V11L17 13Z" fill="#EF4444" />
  </svg>
);

const SCENE_GLOWS: Record<Occupation['category'], { primary: string; secondary: string; accent: string }> = {
  Realistic: { primary: 'rgba(34, 197, 94, 0.28)', secondary: 'rgba(245, 158, 11, 0.18)', accent: 'rgba(15, 23, 42, 0.24)' },
  Investigative: { primary: 'rgba(14, 165, 233, 0.28)', secondary: 'rgba(99, 102, 241, 0.18)', accent: 'rgba(255, 255, 255, 0.28)' },
  Artistic: { primary: 'rgba(236, 72, 153, 0.24)', secondary: 'rgba(249, 115, 22, 0.18)', accent: 'rgba(255, 255, 255, 0.26)' },
  Social: { primary: 'rgba(16, 185, 129, 0.26)', secondary: 'rgba(59, 130, 246, 0.16)', accent: 'rgba(255, 255, 255, 0.30)' },
  Enterprising: { primary: 'rgba(245, 158, 11, 0.26)', secondary: 'rgba(239, 68, 68, 0.16)', accent: 'rgba(255, 255, 255, 0.26)' },
  Conventional: { primary: 'rgba(99, 102, 241, 0.24)', secondary: 'rgba(20, 184, 166, 0.14)', accent: 'rgba(255, 255, 255, 0.24)' },
};

const AnimatedOccupationImage = ({ data, packId }: { data: Occupation; packId: string }) => {
  const { t } = useT();
  const sceneGlow = SCENE_GLOWS[data.category];

  // Start from the selected pack's image; re-resolve if the pack or card changes.
  const [src, setSrc] = useState(() => resolvePackImageUrl(data.imageUrl, packId));
  useEffect(() => { setSrc(resolvePackImageUrl(data.imageUrl, packId)); }, [data.imageUrl, packId]);

  if (!data.imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
        <span className="text-sm">{t('card.noImage')}</span>
      </div>
    );
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Pack art missing for this card — fall back to the default Classic image.
    const fallback = defaultImageUrl(data.imageUrl);
    if (src !== fallback) {
      setSrc(fallback);
    } else {
      (e.target as HTMLImageElement).style.display = 'none';
    }
  };

  // Static card image (no idle zoom/pan/float, shine, or sparkle animations).
  return (
    <div
      className="absolute inset-0 occupation-scene"
      style={{
        '--scene-primary': sceneGlow.primary,
        '--scene-secondary': sceneGlow.secondary,
        '--scene-accent': sceneGlow.accent,
      } as React.CSSProperties}
    >
      <img
        key={src}
        src={src}
        alt=""
        className="relative z-10 w-full h-full object-cover pointer-events-none select-none occupation-image-live"
        style={{ objectPosition: 'center top' }}
        draggable={false}
        onError={handleImageError}
      />
      <div className="absolute inset-0 z-20 occupation-vignette" />
    </div>
  );
};

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(({ data, onSwipe, index, total, packId }, ref) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { t, lang } = useT();
  const card = localizeOccupation(data, lang);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  // Overlay opacities for Like/Nope indicators
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [0, -100], [0, 1]);
  const maybeOpacity = useTransform(y, [0, -100], [0, 1]);

  // Allow parent to trigger swipe via button
  useImperativeHandle(ref, () => ({
    triggerSwipe: (direction: ResponseChoice) => {
      onSwipe(direction);
    }
  }));

  const handleDragEnd = (_event: any, info: PanInfo) => {
    if (info.offset.y < -100 && Math.abs(info.offset.x) < 120) {
      onSwipe('maybe');
    } else if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  const tagColor = RIASEC_COLORS[data.category];

  return (
    <motion.div
      style={{ x, y, rotate, opacity, willChange: 'transform, opacity' }}
      drag={!isFlipped}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      variants={{
        initial: { scale: 0.95, y: 10, opacity: 0 },
        animate: { scale: 1, y: 0, opacity: 1 },
        exit: (direction: ResponseChoice) => ({
          x: direction === 'right' ? 300 : direction === 'left' ? -300 : 0,
          y: direction === 'maybe' ? -160 : 0,
          opacity: 0,
          scale: 0.95,
          transition: { duration: 0.3 }
        })
      }}
      initial="initial"
      animate="animate"
      exit="exit"
      className="absolute top-0 left-0 w-full h-full perspective-1000 z-20"
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
      >

        {/* --- FRONT OF CARD (IMAGE) --- */}
        <div
          aria-hidden={isFlipped}
          role="button"
          tabIndex={isFlipped ? -1 : 0}
          onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isFlipped) { e.preventDefault(); setIsFlipped(true); } }}
          onClick={() => setIsFlipped(true)}
          className="absolute w-full h-full backface-hidden bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200 flex flex-col z-10 cursor-pointer"
        >

          {/* Swipe Indicators */}
          <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 z-30 transform -rotate-12 pointer-events-none">
            <ChunkyThumbsUp size={88} />
          </motion.div>
          <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-8 z-30 transform rotate-12 pointer-events-none">
            <ChunkyThumbsDown size={88} />
          </motion.div>
          <motion.div style={{ opacity: maybeOpacity }} className="absolute top-8 left-1/2 z-30 -translate-x-1/2 pointer-events-none">
            <div className="px-5 py-3 rounded-2xl border-4 border-yellow-400 bg-white text-yellow-700 font-black uppercase tracking-wide shadow-lg">
              {t('common.maybe')}
            </div>
          </motion.div>

          {/* Image Container */}
          <div className="flex-1 relative bg-gray-100 overflow-hidden">
            <AnimatedOccupationImage data={card} packId={packId} />
          </div>

          {/* Title Area */}
          <div className="h-[19%] flex flex-col items-center justify-center p-3 relative" style={{ backgroundColor: BRAND_COLORS.blue }}>
            <h2 className="text-2xl font-bold text-white text-center leading-tight px-14">{card.title}</h2>
            {card.description && (
            <p className="text-base text-white text-center mt-1 leading-snug line-clamp-2 px-16">{card.description}</p>
            )}
            {speechSupported && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); speak(`${card.title}. ${card.description || ''}`, lang); }}
                tabIndex={isFlipped ? -1 : 0}
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30 z-50 cursor-pointer active:scale-90"
                aria-label={t('common.readAloud')}
              >
                <Volume2 className="w-6 h-6 text-white" />
              </button>
            )}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFlipped(true); }}
              tabIndex={isFlipped ? -1 : 0}
              className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30 z-50 cursor-pointer active:scale-90"
              aria-label={t('card.viewDetails')}
            >
              <Info className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* --- BACK OF CARD (DETAILS) --- */}
        <div aria-hidden={!isFlipped} className="absolute w-full h-full backface-hidden rotate-y-180 bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col border border-gray-200 z-0">
          <div className="flex justify-between items-start p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
            <div className="pr-2">
              <h3 className="text-3xl font-bold text-gray-800 leading-tight">{card.title}</h3>
              <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase"
                style={{ backgroundColor: tagColor, color: contrastText(tagColor) }}>
                {t('riasec.label.' + data.category)}
              </span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
              tabIndex={!isFlipped ? -1 : 0}
              aria-label={t('card.backToSwipe')}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 shrink-0 mt-1">
              <Undo2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {card.description && (
              <p className="text-lg text-gray-600 leading-relaxed font-medium">{card.description}</p>
            )}
            <div className="p-4 rounded-xl border border-teal-100 bg-teal-50">
              <p className="text-sm font-black uppercase tracking-wide text-teal-800 mb-1">{t('card.whatThisMeans')}</p>
              <p className="text-base text-teal-950 leading-relaxed">{t('card.typeSignal', { type: t('riasec.label.' + data.category) })}</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-2">
              <p className="text-lg text-blue-600/90 font-black mb-2">{t('card.dataSource')}</p>
              <a href={`https://www.onetonline.org/link/summary/${encodeURIComponent(data.onetCode)}`} target="_blank" rel="noopener noreferrer"
                tabIndex={!isFlipped ? -1 : 0}
                className="flex items-center text-lg font-bold hover:underline" style={{ color: BRAND_COLORS.blue }}>
                {t('card.viewReport')} <ExternalLink className="w-6 h-6 ml-2" />
              </a>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                <p className="text-sm font-black uppercase tracking-wide text-orange-700 mb-1">{t('card.dayInLife')}</p>
                <p className="text-base text-orange-900 leading-relaxed">{t('card.day.' + data.category)}</p>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                <p className="text-sm font-black uppercase tracking-wide text-purple-700 mb-1">{t('card.skills')}</p>
                <p className="text-base text-purple-900 leading-relaxed">{t('card.skills.' + data.category)}</p>
              </div>
              <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-100">
                <p className="text-sm font-black uppercase tracking-wide text-yellow-700 mb-1">{t('card.tryInSchool')}</p>
                <p className="text-base text-yellow-900 leading-relaxed">{t('card.try.' + data.category)}</p>
              </div>
            </div>
            {card.tasks && card.tasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 text-gray-700">
                  <ListChecks className="w-6 h-6" style={{ color: BRAND_COLORS.blue }} />
                  <h4 className="font-bold text-sm uppercase tracking-wide">{t('card.primaryTasks')}</h4>
                </div>
                <ul className="space-y-4">
                  {card.tasks.map((task, i) => (
                    <li key={i} className="flex items-start text-xl font-medium text-gray-700 leading-snug bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <span className="w-2 h-2 rounded-full mt-2.5 mr-3 shrink-0" style={{ backgroundColor: BRAND_COLORS.lightBlue }}></span>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {card.workActivities && card.workActivities.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 text-gray-700">
                  <Activity className="w-6 h-6" style={{ color: BRAND_COLORS.green }} />
                  <h4 className="font-bold text-sm uppercase tracking-wide">{t('card.topActivities')}</h4>
                </div>
                <div className="space-y-4">
                  {card.workActivities.map((activity, i) => {
                    const [title, desc] = activity.split(' — ');
                    return (
                      <div key={i} className="bg-green-50 p-4 rounded-xl border border-green-100">
                        <span className="font-bold text-green-900 block mb-1 text-xl">{title}</span>
                        {desc && <span className="text-green-800 text-lg block leading-relaxed opacity-90">{desc}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="h-16"></div>
          </div>
          <div className="p-4 bg-white border-t border-gray-100 absolute bottom-0 w-full">
            <button onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
              tabIndex={!isFlipped ? -1 : 0}
              className="w-full py-3 text-white rounded-xl font-bold transition-colors shadow-lg"
              style={{ backgroundColor: BRAND_COLORS.black }}>
              {t('card.backToSwipe')}
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
});
