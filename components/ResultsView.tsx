import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Download, ChevronRight, ChevronDown, Undo2, Loader2, ArrowLeft, Volume2, Copy, Star, Search, Share2, Lightbulb, Printer, MessageCircle, ClipboardCheck, RefreshCcw } from 'lucide-react';
import { Scores, RiasecType, Occupation, SwipeResponse } from '../types';
import { RIASEC_COLORS, BRAND_COLORS, contrastText } from '../constants';
import { computeProfile, generateSummary, topContributors, RIASEC_TYPES } from '../careerProfile';
import { localizeOccupation } from '../occupations.es';
import { CompassLogo } from './LoginView';
import { InkTrigger } from './Ink';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
// @ts-ignore
import { jsPDF } from 'jspdf';
import { useT } from '../i18n';
import { speak, speechSupported } from '../speech';
import { LegalSupport } from './LegalSupport';

interface ResultsViewProps {
  scores: Scores;
  onRestart: () => void;
  onEditResponses: () => void;
  onRetakeType: (type: RiasecType) => void;
  totalCards: number;
  answeredCount: number;
  userName: string;
  swipeHistory: SwipeResponse[];
  deck: Occupation[];
  likedCards: Occupation[];
  maybeCards: Occupation[];
  onClearData: () => void | Promise<void>;
  onOpenInk?: () => void;
  careerVerse?: { title: string; url: string } | null;
}

// Flippable Result Card
const ResultItemCard: React.FC<{ type: RiasecType; score: number; rawScore: number; rank: number }> = ({ type, score, rawScore, rank }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { t } = useT();
  const bgColor = RIASEC_COLORS[type];
  const fg = contrastText(bgColor);
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="relative w-full h-52 perspective-1000 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}
      role="button" tabIndex={0} aria-expanded={isFlipped} aria-label={t('riasec.label.' + type)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsFlipped(f => !f); } }}>
      <motion.div className="w-full h-full relative transition-all duration-500 transform-style-3d" animate={{ rotateY: isFlipped ? 180 : 0 }}>
        <div className="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{medals[rank] || ''}</span>
              <h4 className="font-bold text-gray-900 text-xl">{t('riasec.label.' + type)}</h4>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: bgColor, color: contrastText(bgColor) }}>
              <span className="text-xs">{score.toFixed(1)}%</span>
            </div>
          </div>
          <p className="text-gray-600 text-base leading-relaxed line-clamp-3 my-2">{t('riasec.desc.' + type)}</p>
          <p className="text-xs font-bold text-gray-500">{Math.round(rawScore * 10) / 10} {t('results.rawScore')}</p>
          <div className="text-sm font-bold uppercase tracking-wide flex items-center" style={{ color: bgColor }}>
            {t('results.tapToLearn')} <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl shadow-sm p-5 flex flex-col" style={{ backgroundColor: bgColor, color: fg }}>
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h4 className="font-bold text-xl">{t('riasec.label.' + type)}</h4>
            <Undo2 className="w-5 h-5 opacity-70" />
          </div>
          <div className="overflow-y-auto custom-scrollbar pr-1 flex-1">
            <p className="text-base leading-relaxed opacity-95">{t('riasec.detail.' + type)}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// INK-013: collapsible results section. Lower-value modules collapse by default
// to shorten the page; the headline modules stay expanded (rendered as plain
// cards). Native <details> keeps this keyboard- and screen-reader-accessible.
const Collapsible: React.FC<{ header: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }> = ({ header, defaultOpen = false, children }) => (
  <details open={defaultOpen} className="bg-white rounded-2xl border border-gray-100 shadow-sm">
    <summary className="flex cursor-pointer items-center justify-between gap-3 p-5">
      <div className="min-w-0 flex-1">{header}</div>
      <ChevronDown className="accordion-chevron w-5 h-5 shrink-0 text-gray-400" aria-hidden="true" />
    </summary>
    <div className="px-5 pb-5 pt-0">{children}</div>
  </details>
);

// Hex to RGB helper
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export const ResultsView: React.FC<ResultsViewProps> = ({ scores, onRestart, onEditResponses, onRetakeType, totalCards, answeredCount, userName, swipeHistory, deck, likedCards, maybeCards, onClearData, onOpenInk, careerVerse }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [shortlistExpanded, setShortlistExpanded] = useState(false);
  const [careerQuery, setCareerQuery] = useState('');
  const [careerFilter, setCareerFilter] = useState<'all' | 'starred' | RiasecType>('all');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [counselorView, setCounselorView] = useState(false);
  const [radarInfo, setRadarInfo] = useState<RiasecType | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('cc_favoriteCareers') || '{}'); } catch { return {}; }
  });
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('cc_careerNotes') || '{}'); } catch { return {}; }
  });
  const { t, lang } = useT();

  // --- Weighted Profile Computation ---
  const profile = computeProfile(likedCards, maybeCards);
  const generatedSummary = generateSummary(profile);
  const { ranked, code: hollandCode, codeTypes, hasTopTie, hasBoundaryTie, tiedTypes } = profile;

  const top3 = codeTypes.slice(0, 3);
  const displayName = userName || t('results.defaultName');
  const summary = lang === 'en'
    ? generatedSummary
    : {
        heading: t('summary.heading'),
        body: top3.length
          ? t('summary.body', { types: top3.map(x => t('riasec.label.' + x.type)).join(', ') })
          : t('summary.empty'),
      };

  // INK-021: deep-link to the user's interest code on O*NET. Verified that
  // onetonline.org supports up to three chained interest areas in the path
  // (e.g. /explore/interests/Social/Enterprising/); fall back to the interests
  // browse page when there is no code yet.
  const onetUrl = top3.length > 0
    ? `https://www.onetonline.org/explore/interests/${top3.map(x => x.type).join('/')}/`
    : 'https://www.onetonline.org/explore/interests/';

  // For the score breakdown bar chart
  const maxScore = ranked[0]?.score || 1;
  const totalLikes = profile.likedCount;
  const likedSeen = new Set<string>();
  const likedUnique: Occupation[] = likedCards.filter(o => {
    if (likedSeen.has(o.id)) return false;
    likedSeen.add(o.id);
    return true;
  });
  const maybeSeen = new Set<string>(likedUnique.map(o => o.id));
  const maybeUnique: Occupation[] = maybeCards.filter(o => {
    if (maybeSeen.has(o.id)) return false;
    maybeSeen.add(o.id);
    return true;
  });
  const shortlist = [
    ...likedUnique.map(occ => ({ occ, response: 'liked' as const })),
    ...maybeUnique.map(occ => ({ occ, response: 'maybe' as const })),
  ];
  // INK-A: explain each top dimension by the occupations that most contribute to
  // it, never by like/curious counts. Contributors are the occupations the user
  // responded to (liked first, then curious), ranked by their interest value in
  // that dimension — so a type can be explained even with zero direct likes
  // (e.g. Social surfacing from liked occupations that carry a Social profile).
  const contributorsFor = (type: RiasecType, n = 2): Occupation[] =>
    topContributors(type, likedUnique, maybeUnique, n);
  const contributorTitles = (type: RiasecType, n = 2): string =>
    contributorsFor(type, n).map(o => localizeOccupation(o, lang).title).join(', ');
  const strongestEvidence = top3
    .map(item => `${t('riasec.label.' + item.type)}: ${contributorTitles(item.type) || t('results.contributorsGeneric')}`)
    .join(' | ');
  const topSignals = top3.map(item => ({
    ...item,
    contributors: contributorsFor(item.type),
  }));
  const displayAnsweredCount = totalCards > 0 ? Math.min(answeredCount, totalCards) : answeredCount;
  const answeredRatio = totalCards > 0 ? displayAnsweredCount / totalCards : 0;
  const topGap = ranked[0] && ranked[1] ? ranked[0].score - ranked[1].score : 0;
  const topGapRatio = ranked[0]?.score ? topGap / ranked[0].score : 0;
  const confidenceLevel = displayAnsweredCount < Math.min(12, totalCards || 12) || answeredRatio < 0.45
    ? 'low'
    : (hasTopTie || hasBoundaryTie || topGapRatio < 0.08 ? 'medium' : 'high');
  const confidenceColor = confidenceLevel === 'high' ? BRAND_COLORS.green : confidenceLevel === 'medium' ? BRAND_COLORS.orange : BRAND_COLORS.plum;
  const filteredShortlist = useMemo(() => shortlist.filter(({ occ }) => {
    const lo = localizeOccupation(occ, lang);
    const query = careerQuery.trim().toLowerCase();
    const matchesQuery = !query || `${lo.title} ${lo.description} ${t('riasec.label.' + occ.category)}`.toLowerCase().includes(query);
    const matchesFilter = careerFilter === 'all' || (careerFilter === 'starred' ? favorites[occ.id] : occ.category === careerFilter);
    return matchesQuery && matchesFilter;
  }), [shortlist, careerFilter, careerQuery, favorites, lang, t]);
  const visibleShortlist = shortlistExpanded ? filteredShortlist : filteredShortlist.slice(0, 8);

  useEffect(() => { try { localStorage.setItem('cc_favoriteCareers', JSON.stringify(favorites)); } catch { /* ignore */ } }, [favorites]);
  useEffect(() => { try { localStorage.setItem('cc_careerNotes', JSON.stringify(notes)); } catch { /* ignore */ } }, [notes]);
  const spokenResults = hollandCode
    ? t('results.spoken', { code: hollandCode.split('').join(', '), types: top3.map(x => t('riasec.label.' + x.type)).join(', ') })
    : t('results.noSignificant');

  // Radar chart data
  const radarData = RIASEC_TYPES.map(t => ({
    type: t,
    score: profile.totals[t],
    normalized: ranked.find(r => r.type === t)?.normalized || 0,
  }));

  // --- Share Handlers ---
  const currentUrl = 'https://career-inklings.netlify.app/';
  const shareText = t('results.shareText', { code: hollandCode });
  const summaryText = `${t('results.interestCode')}: ${hollandCode || '---'}\n${summary.heading}: ${summary.body}\n${t('results.evidence')}: ${strongestEvidence}`;
  const handleShareFacebook = () => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank'); };
  const handleShareLinkedIn = () => { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`, '_blank'); };
  const handleShareWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + currentUrl)}`, '_blank'); };
  const handleShareX = () => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`, '_blank'); };
  const [copied, setCopied] = useState(false);
  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(currentUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* fallback */ }
  };
  const handleCopySummary = async () => {
    try { await navigator.clipboard.writeText(summaryText); setCopiedSummary(true); setTimeout(() => setCopiedSummary(false), 2000); }
    catch { /* fallback */ }
  };
  const appendNote = (id: string, text: string) => {
    setNotes(prev => ({ ...prev, [id]: prev[id] ? `${prev[id]}\n${text}` : text }));
  };
  const handlePrint = () => window.print();

  // --- PDF GENERATION — Inklings teen report (cover + results), modeled on Report/inklings-report-teen ---
  const generatePdfBlob = async (): Promise<Blob> => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const P: any = pdf;
    const W = 215.9, H = 279.4;
    const margin = 18, contentW = W - margin * 2;
    let y = 0;

    // Report palette (from the inklings-report-teen design)
    const C = {
      deep: hexToRgb('#00384D'), orange: hexToRgb('#FF6C37'), teal: hexToRgb('#44797B'),
      gold: hexToRgb('#FFB548'), red: hexToRgb('#CF3327'), blue: hexToRgb('#44A2B9'),
      paper: hexToRgb('#FBF6EE'), cover: hexToRgb('#FDFBF7'), ink: hexToRgb('#2A2118'),
      muted: hexToRgb('#8A8073'), line: hexToRgb('#E7DECF'), body: hexToRgb('#5F5648'),
      noteBg: hexToRgb('#EEF6F8'), noteLine: hexToRgb('#CFE7EE'), noteInk: hexToRgb('#41606B'),
    };
    const TYPE_COLOR: Record<RiasecType, [number, number, number]> = {
      [RiasecType.Realistic]: C.teal,
      [RiasecType.Investigative]: C.deep,
      [RiasecType.Artistic]: C.orange,
      [RiasecType.Social]: C.gold,
      [RiasecType.Enterprising]: C.red,
      [RiasecType.Conventional]: C.blue,
    };
    const typeLabel = (ty: RiasecType) => t('riasec.label.' + ty);

    const bg = (rgb: [number, number, number]) => { P.setFillColor(...rgb); P.rect(0, 0, W, H, 'F'); };
    const ensure = (space: number) => { if (y + space > H - 14) { pdf.addPage(); bg(C.paper); y = 20; } };

    // liked-career counts per type
    const likedByType = {} as Record<RiasecType, number>;
    for (const rt of RIASEC_TYPES) likedByType[rt] = 0;
    likedUnique.forEach(o => { if (likedByType[o.category] !== undefined) likedByType[o.category]++; });

    // ============== PAGE 1 — COVER ==============
    bg(C.cover);
    const sprout = (ox: number, oy: number, rgb: [number, number, number], dir: number) => {
      P.setDrawColor(...rgb); P.setLineWidth(0.7);
      P.line(ox, oy, ox + 22 * dir, oy + 40);
      P.setFillColor(...rgb);
      [[6, 10], [11, 20], [16, 30]].forEach(([dx, dy]) => P.ellipse(ox + dx * dir, oy + dy, 4.5, 2.4, 'F'));
    };
    P.setGState(new P.GState({ opacity: 0.20 }));
    sprout(margin + 4, 18, C.teal, 1);
    sprout(W - margin - 4, H - 70, C.gold, -1);
    P.setGState(new P.GState({ opacity: 1 }));

    P.setTextColor(...C.teal); P.setFont('helvetica', 'bold'); P.setFontSize(9);
    P.text(t('report.eyebrow'), W / 2, 98, { align: 'center', charSpace: 1.4 });
    P.setTextColor(...C.deep); P.setFont('helvetica', 'bold'); P.setFontSize(46);
    P.text('Inklings', W / 2, 120, { align: 'center' });
    P.setTextColor(...C.orange); P.setFont('times', 'italic'); P.setFontSize(16);
    P.text('Follow your inklings', W / 2, 130, { align: 'center' });
    P.setDrawColor(...C.deep); P.setLineWidth(0.5); P.line(W / 2 - 11, 140, W / 2 + 11, 140);
    P.setTextColor(...C.muted); P.setFont('helvetica', 'normal'); P.setFontSize(11);
    P.text(t('report.preparedFor'), W / 2, 155, { align: 'center' });
    P.setTextColor(...C.deep); P.setFont('helvetica', 'bold'); P.setFontSize(15);
    P.text(displayName, W / 2, 164, { align: 'center' });
    const tiles = top3.map(x => x.type);
    if (tiles.length) {
      const tw = 12, gap = 4;
      const totalTileW = tiles.length * tw + (tiles.length - 1) * gap;
      let tx = W / 2 - totalTileW / 2;
      tiles.forEach(tp => {
        P.setFillColor(...TYPE_COLOR[tp]); P.roundedRect(tx, 176, tw, tw, 2.5, 2.5, 'F');
        P.setTextColor(255, 255, 255); P.setFont('helvetica', 'bold'); P.setFontSize(15);
        P.text(tp.charAt(0), tx + tw / 2, 176 + tw / 2 + 2.2, { align: 'center' });
        tx += tw + gap;
      });
    }
    P.setTextColor(...C.muted); P.setFont('helvetica', 'normal'); P.setFontSize(9);
    P.text('by Create Your Why, LLC', W / 2, H - 22, { align: 'center' });

    // ============== PAGE 2 — RESULTS ==============
    pdf.addPage(); bg(C.paper);
    P.setFillColor(...C.deep); P.rect(0, 0, W, 24, 'F');
    const cmX = margin + 4, cmY = 12;
    P.setDrawColor(255, 255, 255); P.setLineWidth(0.6); P.circle(cmX, cmY, 4, 'S');
    P.setFillColor(...C.orange); P.triangle(cmX, cmY - 3.4, cmX - 1.7, cmY, cmX, cmY - 0.6, 'F');
    P.setFillColor(...C.gold); P.triangle(cmX, cmY + 3.4, cmX + 1.7, cmY, cmX, cmY + 0.6, 'F');
    P.setFillColor(255, 255, 255); P.circle(cmX, cmY, 0.7, 'F');
    P.setTextColor(255, 255, 255); P.setFont('helvetica', 'bold'); P.setFontSize(13);
    P.text('Inklings', cmX + 8, 11);
    P.setTextColor(169, 212, 223); P.setFont('helvetica', 'normal'); P.setFontSize(7);
    P.text('INTERESTS', cmX + 8, 16, { charSpace: 1 });
    P.setTextColor(191, 226, 236); P.setFontSize(9);
    P.text('Follow your inklings', W - margin, 14, { align: 'right' });

    y = 36;
    P.setTextColor(...C.deep); P.setFont('helvetica', 'bold'); P.setFontSize(17);
    P.text(t('report.intro.h1'), W / 2, y, { align: 'center' });
    y += 7;
    P.setTextColor(...C.body); P.setFont('helvetica', 'normal'); P.setFontSize(9.5);
    const introLines = pdf.splitTextToSize(t('report.intro.p'), 120);
    P.text(introLines, W / 2, y, { align: 'center' });
    y += introLines.length * 4.6 + 4;

    if (top3.length) {
      const gap = 5;
      const cardW = (contentW - gap * 2) / 3;
      const capH = 20, bodyH = 16, cardH = capH + bodyH;
      const cardY = y;
      top3.forEach((rt, i) => {
        const cx0 = margin + i * (cardW + gap);
        P.setFillColor(255, 255, 255); P.setDrawColor(...C.line); P.setLineWidth(0.3);
        P.roundedRect(cx0, cardY, cardW, cardH, 3, 3, 'FD');
        P.setFillColor(...TYPE_COLOR[rt.type]);
        P.roundedRect(cx0, cardY, cardW, capH, 3, 3, 'F');
        P.rect(cx0, cardY + capH - 4, cardW, 4, 'F');
        P.setTextColor(255, 255, 255); P.setFont('helvetica', 'bold'); P.setFontSize(26);
        P.text(rt.type.charAt(0), cx0 + cardW / 2, cardY + capH / 2 + 4, { align: 'center' });
        P.setTextColor(...C.deep); P.setFont('helvetica', 'bold'); P.setFontSize(11);
        P.text(typeLabel(rt.type), cx0 + cardW / 2, cardY + capH + 7, { align: 'center' });
        P.setTextColor(...C.muted); P.setFont('helvetica', 'normal'); P.setFontSize(8.5);
        P.text(t('report.youLiked', { n: likedByType[rt.type] }), cx0 + cardW / 2, cardY + capH + 12.5, { align: 'center' });
        P.link(cx0, cardY, cardW, cardH, { url: `https://www.onetonline.org/explore/interests/${rt.type}/` });
      });
      y = cardY + cardH + 4;
      P.setTextColor(...C.muted); P.setFont('helvetica', 'italic'); P.setFontSize(7.5);
      P.text(t('report.cardsHint'), W / 2, y, { align: 'center' });
      y += 8;

      // radar panel
      const panelH = 80;
      P.setFillColor(255, 255, 255); P.setDrawColor(...C.line); P.setLineWidth(0.3);
      P.roundedRect(margin, y, contentW, panelH, 4, 4, 'FD');
      const cx = W / 2, cyc = y + 38, R = 30;
      const rp = (i: number, r: number): [number, number] => {
        const a = (i * 60) * Math.PI / 180; return [cx + r * Math.sin(a), cyc - r * Math.cos(a)];
      };
      const normByType = {} as Record<RiasecType, number>;
      ranked.forEach(r => { normByType[r.type] = r.normalized; });
      const maxVal = Math.max(5, Math.ceil(Math.max(...RIASEC_TYPES.map(ty => normByType[ty] || 0)) / 5) * 5);
      const polyRel = (pts: [number, number][], style: string) => {
        const segs = pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]);
        P.lines(segs, pts[0][0], pts[0][1], [1, 1], style, true);
      };
      P.setDrawColor(...C.line); P.setLineWidth(0.25);
      for (let k = 1; k <= 4; k++) polyRel(RIASEC_TYPES.map((_, i) => rp(i, R * k / 4)), 'S');
      RIASEC_TYPES.forEach((_, i) => { const [vx, vy] = rp(i, R); P.line(cx, cyc, vx, vy); });
      const dataPts = RIASEC_TYPES.map((ty, i) => rp(i, R * (normByType[ty] || 0) / maxVal));
      P.setGState(new P.GState({ opacity: 0.18 })); P.setFillColor(...C.orange); polyRel(dataPts, 'F');
      P.setGState(new P.GState({ opacity: 1 }));
      P.setDrawColor(...C.orange); P.setLineWidth(0.9); polyRel(dataPts, 'S');
      RIASEC_TYPES.forEach((ty, i) => {
        const isTop = top3.some(x => x.type === ty);
        const [dx, dy] = dataPts[i];
        P.setFillColor(...TYPE_COLOR[ty]); P.setDrawColor(255, 255, 255); P.setLineWidth(0.4);
        P.circle(dx, dy, isTop ? 1.8 : 1.1, 'FD');
        const [lx, ly] = rp(i, R + 5.5);
        P.setTextColor(...(isTop ? TYPE_COLOR[ty] : C.muted)); P.setFont('helvetica', isTop ? 'bold' : 'normal'); P.setFontSize(8);
        P.text(ty.charAt(0), lx, ly + 1, { align: 'center' });
      });
      let cy2 = y + panelH - 16;
      P.setTextColor(...C.muted); P.setFont('helvetica', 'normal'); P.setFontSize(8);
      const capLines = pdf.splitTextToSize(t('report.radarCaption'), contentW - 30);
      P.text(capLines, W / 2, cy2, { align: 'center' });
      cy2 += capLines.length * 3.6 + 1.5;
      P.setTextColor(...C.deep); P.setFont('helvetica', 'bold'); P.setFontSize(8.5);
      P.text(t('report.likedTotal', { n: totalLikes, total: totalCards }), W / 2, cy2, { align: 'center' });
      y += panelH + 9;

      // what these mean
      ensure(14 + top3.length * 16);
      P.setTextColor(...C.orange); P.setFont('helvetica', 'bold'); P.setFontSize(10);
      P.text(t('report.meanHeading'), margin, y); y += 7;
      top3.forEach(rt => {
        const rowY = y;
        P.setFillColor(...TYPE_COLOR[rt.type]); P.roundedRect(margin, rowY - 4, 9, 9, 2, 2, 'F');
        P.setTextColor(255, 255, 255); P.setFont('helvetica', 'bold'); P.setFontSize(10);
        P.text(rt.type.charAt(0), margin + 4.5, rowY + 2.2, { align: 'center' });
        P.setTextColor(...C.deep); P.setFont('helvetica', 'bold'); P.setFontSize(10);
        P.text(typeLabel(rt.type), margin + 13, rowY);
        P.setTextColor(...C.body); P.setFont('helvetica', 'normal'); P.setFontSize(8.8);
        const dl = pdf.splitTextToSize(t('report.mean.' + rt.type), contentW - 13);
        P.text(dl, margin + 13, rowY + 4.5);
        y = rowY + 4.5 + dl.length * 3.7 + 4;
      });
      y += 2;

      // careers you liked (chips)
      ensure(20);
      P.setTextColor(...C.orange); P.setFont('helvetica', 'bold'); P.setFontSize(10);
      P.text(t('report.likedHeading'), margin, y); y += 5.5;
      P.setTextColor(...C.muted); P.setFont('helvetica', 'italic'); P.setFontSize(7.5);
      P.text(t('report.likedNote'), margin, y); y += 6;
      let chipX = margin;
      const chipH = 7, chipGap = 3, padX = 4, dotR = 1.2;
      P.setFont('helvetica', 'normal'); P.setFontSize(8.8);
      likedUnique.forEach(o => {
        const title = localizeOccupation(o, lang).title;
        const tw = P.getTextWidth(title);
        const chipW = padX + dotR * 2 + 2 + tw + padX;
        if (chipX + chipW > W - margin) { chipX = margin; y += chipH + chipGap; ensure(chipH + 2); }
        P.setDrawColor(...C.line); P.setLineWidth(0.3); P.setFillColor(255, 255, 255);
        P.roundedRect(chipX, y, chipW, chipH, 3.5, 3.5, 'FD');
        P.setFillColor(...TYPE_COLOR[o.category]); P.circle(chipX + padX + dotR, y + chipH / 2, dotR, 'F');
        P.setTextColor(...C.ink); P.setFont('helvetica', 'normal'); P.setFontSize(8.8);
        P.text(title, chipX + padX + dotR * 2 + 2, y + chipH / 2 + 1.6);
        if (o.onetCode) P.link(chipX, y, chipW, chipH, { url: `https://www.onetonline.org/link/summary/${encodeURIComponent(o.onetCode)}` });
        chipX += chipW + chipGap;
      });
      y += chipH + 8;
    } else {
      P.setTextColor(...C.body); P.setFont('helvetica', 'normal'); P.setFontSize(11);
      const nl = pdf.splitTextToSize(t('results.noSignificant'), contentW);
      P.text(nl, W / 2, y, { align: 'center' }); y += nl.length * 5 + 6;
    }

    // try this next
    ensure(48);
    P.setTextColor(...C.orange); P.setFont('helvetica', 'bold'); P.setFontSize(10);
    P.text(t('report.tryHeading'), margin, y); y += 7;
    const steps = [t('report.step1'), t('report.step2'), t('report.step3'), t('report.step4')];
    steps.forEach((s, i) => {
      ensure(12);
      P.setFillColor(...C.orange); P.circle(margin + 3.2, y + 0.5, 3.2, 'F');
      P.setTextColor(255, 255, 255); P.setFont('helvetica', 'bold'); P.setFontSize(8.5);
      P.text(String(i + 1), margin + 3.2, y + 1.8, { align: 'center' });
      P.setTextColor(...C.body); P.setFont('helvetica', 'normal'); P.setFontSize(9);
      const sl = pdf.splitTextToSize(s, contentW - 10);
      P.text(sl, margin + 9, y + 1.8);
      if (i === 2) P.link(margin + 9, y - 2, contentW - 10, sl.length * 4 + 2, { url: 'https://www.mynextmove.org/' });
      y += Math.max(8, sl.length * 4 + 3);
    });
    y += 3;

    // note box
    ensure(28);
    const noteText = t('report.rememberBody');
    P.setFont('helvetica', 'normal'); P.setFontSize(8.8);
    const noteLines = pdf.splitTextToSize(noteText, contentW - 12);
    const noteBoxH = 10 + noteLines.length * 4;
    P.setFillColor(...C.noteBg); P.setDrawColor(...C.noteLine); P.setLineWidth(0.3);
    P.roundedRect(margin, y, contentW, noteBoxH, 4, 4, 'FD');
    P.setTextColor(...C.deep); P.setFont('helvetica', 'bold'); P.setFontSize(9.5);
    P.text(t('report.rememberTitle'), margin + 6, y + 6.5);
    P.setTextColor(...C.noteInk); P.setFont('helvetica', 'normal'); P.setFontSize(8.8);
    P.text(noteLines, margin + 6, y + 11.5);
    y += noteBoxH + 8;

    // footer
    ensure(12);
    P.setDrawColor(...C.line); P.setLineWidth(0.3); P.line(margin, y, W - margin, y); y += 5;
    P.setTextColor(...C.muted); P.setFont('helvetica', 'normal'); P.setFontSize(8);
    P.text(t('report.footer'), margin, y);
    P.text('© Create Your Why, LLC', W - margin, y, { align: 'right' });

    return pdf.output('blob');
  };

  // --- DOWNLOAD PDF ---
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfError(false);
    try {
      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (displayName || 'student').replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'student';
      const safeCode = hollandCode.replace(/[^A-Za-z]/g, '') || 'results';
      a.download = `Inklings_Report_${safeCode}_${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF Generation failed', err);
      setPdfError(true);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f6f9f6] relative">

      {/* --- HEADER (compact, INK-013) --- */}
      <div className="pt-6 pb-3 px-6 text-center border-b border-gray-100 bg-[#f6f9f6] shrink-0 z-10">
        <div className="flex items-center justify-center gap-2">
          <CompassLogo size={24} />
          <h1 className="text-base font-bold text-gray-900">Inklings</h1>
        </div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mt-1">{t('results.title')}</h2>
        {userName && <p className="text-xs text-gray-500">{t('results.for', { name: userName })}</p>}
        {onOpenInk && <InkTrigger onClick={onOpenInk} className="absolute top-3 left-4 bg-gray-100 hover:bg-gray-200 transition-colors" />}
        {speechSupported && (
          <button onClick={() => speak(spokenResults, lang)} aria-label={t('results.readResults')}
            className="absolute top-3 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <Volume2 className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* --- SCROLLABLE CONTENT --- */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-5 py-6 space-y-6 pb-24 bg-[#eef5f2]">

        <div className="text-center bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-bold tracking-widest text-xs uppercase mb-3">{t('results.interestCode')}</h3>
          {hollandCode ? (
            <>
              <div className="text-6xl font-black tracking-wider mb-3" style={{ color: BRAND_COLORS.blue }}>{hollandCode}</div>
              <div className="mt-4 mx-auto max-w-xs rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase tracking-wide text-gray-500">{t('results.confidence')}</span>
                  <span className="text-sm font-black" style={{ color: confidenceColor }}>{t('results.confidence.' + confidenceLevel)}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                  {t('results.confidenceBody.' + confidenceLevel, { answered: displayAnsweredCount, total: totalCards })}
                </p>
              </div>
              {hasTopTie && <p className="text-xs text-gray-500 mt-2">{t('results.topTie')}</p>}
              {hasBoundaryTie && !hasTopTie && (
                <p className="text-xs text-gray-500 mt-2">
                  {t('results.boundaryTieTypes', { types: tiedTypes.map(type => t('riasec.label.' + type)).join(', ') })}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-4 leading-relaxed">{t('results.validityNote')}</p>
            </>
          ) : (
            <div className="py-2">
              <p className="text-lg font-black text-gray-800">{t('results.emptyCodeTitle')}</p>
              <p className="mt-2 mx-auto max-w-xs text-sm text-gray-500 leading-relaxed">{t('results.emptyCodeBody')}</p>
              <button onClick={onRestart}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border-2 px-5 py-3 text-sm font-bold transition-transform active:scale-95"
                style={{ borderColor: BRAND_COLORS.blue, color: BRAND_COLORS.blue }}>
                <RefreshCcw className="w-4 h-4" />
                {t('results.emptyCodeCta')}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5" style={{ color: BRAND_COLORS.orange }} />
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{summary.heading}</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{summary.body}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-5 uppercase tracking-wide">{t('results.fullBreakdown')}</h3>
          {top3.length > 0 ? (
            <div className="space-y-3" role="list">
              {ranked.map((item) => {
                const visualPercent = maxScore > 0 ? (item.score / maxScore) * 100 : 0;
                return (
                  <div key={item.type} className="flex items-center gap-3" role="listitem"
                    aria-label={`${t('riasec.label.' + item.type)} ${item.normalized.toFixed(1)}%, ${Math.round(item.score * 10) / 10} ${t('results.rawScore')}`}>
                    <div className="w-24 text-xs font-bold text-gray-500 uppercase text-right" aria-hidden="true">{t('riasec.label.' + item.type)}</div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden" aria-hidden="true">
                      <motion.div className="h-full rounded-full" style={{ backgroundColor: RIASEC_COLORS[item.type] }}
                        initial={{ width: 0 }} animate={{ width: `${visualPercent}%` }} transition={{ duration: 0.6, delay: 0.1 }} />
                    </div>
                    <div className="w-24 text-right leading-tight shrink-0" aria-hidden="true">
                      <div className="text-xs font-bold text-gray-900">{item.normalized.toFixed(1)}%</div>
                      <div className="text-[10px] font-medium text-gray-500 whitespace-nowrap">{Math.round(item.score * 10) / 10} {t('results.rawScore')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t('results.noSignificant')}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">{t('results.whyTitle')}</h3>
          {top3.length > 0 ? (
            <>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{t('results.whyBody')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {topSignals.map(item => (
                  <div key={item.type} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: RIASEC_COLORS[item.type] }}>
                        {t('riasec.label.' + item.type)}
                      </span>
                      <span className="text-xs font-bold text-gray-500">{item.normalized.toFixed(1)}%</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      {item.contributors.length
                        ? t('results.contributors', { occupations: item.contributors.map(o => localizeOccupation(o, lang).title).join(', ') })
                        : t('results.contributorsGeneric')}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">{t('results.noSignificant')}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">{t('results.topSignals')}</h3>
          {top3.length > 0 ? (
            <div className="space-y-2">
              {topSignals.map(item => (
                <div key={item.type} className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-black shrink-0" style={{ backgroundColor: RIASEC_COLORS[item.type], color: contrastText(RIASEC_COLORS[item.type]) }}>
                    {item.letter}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-800">{t('riasec.label.' + item.type)}</p>
                    <p className="text-xs text-gray-500">
                      {item.contributors.length
                        ? t('results.signalFrom', { occupations: item.contributors.map(o => localizeOccupation(o, lang).title).join(', ') })
                        : t('results.contributorsGeneric')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-gray-900">{item.normalized.toFixed(1)}%</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{t('results.ofProfile')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-gray-50 rounded-xl text-center text-gray-500 text-sm">{t('results.noSignificant')}</div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={handleDownloadPdf} disabled={isGeneratingPdf}
            className="flex items-center justify-center w-full py-4 text-white rounded-xl font-bold transition-transform active:scale-95 shadow-lg hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: BRAND_COLORS.blue }}>
            {isGeneratingPdf ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
            <span>{t('results.downloadReport')}</span>
          </button>
          <button onClick={handleCopySummary}
            className="flex items-center justify-center w-full py-4 rounded-xl font-bold border-2 bg-white transition-transform active:scale-95 hover:bg-gray-50"
            style={{ borderColor: BRAND_COLORS.blue, color: BRAND_COLORS.blue }}>
            <Copy className="w-5 h-5 mr-2" />
            <span>{copiedSummary ? t('results.summaryCopied') : t('results.copySummary')}</span>
          </button>
        </div>
        <button
          onClick={() => setCounselorView(v => !v)}
          className="flex items-center justify-center w-full py-3 rounded-xl font-bold border border-gray-200 bg-white text-gray-700 transition-transform active:scale-95 hover:bg-gray-50"
          aria-pressed={counselorView}
        >
          <ClipboardCheck className="w-4 h-4 mr-2" />
          {counselorView ? t('results.studentView') : t('results.counselorView')}
        </button>
        <span className="sr-only" role="status" aria-live="polite">{copiedSummary ? t('results.summaryCopied') : ''}</span>
        {pdfError && <p className="text-center text-sm text-red-600" role="alert">{t('results.pdfError')}</p>}

        {counselorView && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">{t('results.counselorHeading')}</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{t('results.counselorSub')}</p>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed"><strong>{summary.heading}:</strong> {summary.body}</p>
              <p className="text-sm text-gray-700 leading-relaxed"><strong>{t('results.topSignals')}:</strong> {strongestEvidence || t('results.noEvidence')}</p>
              <p className="text-sm text-gray-700 leading-relaxed"><strong>{t('results.nextSteps')}:</strong> {t('results.printableFocus')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
              <button onClick={handleCopySummary} className="py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">
                {copiedSummary ? t('results.summaryCopied') : t('results.copySummary')}
              </button>
              <button onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                {isGeneratingPdf ? t('results.generating') : t('results.downloadReport')}
              </button>
              <button onClick={handlePrint} className="py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">
                <Printer className="inline w-4 h-4 mr-1" />
                {t('results.print')}
              </button>
            </div>
          </div>
        )}

        <a href={onetUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center w-full py-4 rounded-xl font-bold border border-gray-200 bg-white text-gray-700 transition-transform active:scale-95 hover:bg-gray-50">
          <span>{t('results.viewMatching')}</span>
          <ExternalLink className="w-5 h-5 ml-2" />
        </a>

        {/* CareerVerse handoff — only when a verified slug exists for the top occupation. */}
        {careerVerse && (
          <a href={careerVerse.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 w-full py-4 px-4 rounded-xl font-bold border-2 bg-white transition-transform active:scale-95 hover:bg-gray-50"
            style={{ borderColor: BRAND_COLORS.orange, color: BRAND_COLORS.blue }}>
            <span className="min-w-0 text-left">
              <span className="block truncate">{t('ink.careerverseCta', { occupation: careerVerse.title })}</span>
              <span className="block truncate text-xs font-medium text-gray-500">{t('ink.careerverseBody')}</span>
            </span>
            <ExternalLink className="w-5 h-5 shrink-0" />
          </a>
        )}

        <div>
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-3">{t('results.topInterests')}</h3>
          <div className="space-y-3">
            {top3.length > 0 ? top3.map((item, i) => (
              <ResultItemCard key={item.type} type={item.type} score={Math.round(item.normalized * 10) / 10} rawScore={item.score} rank={i} />
            )) : (
              <div className="p-6 bg-white rounded-xl text-center text-gray-500">{t('results.noSignificant')}</div>
            )}
          </div>
        </div>

        <Collapsible defaultOpen={false} header={
          <div className="flex items-start gap-3">
            <RefreshCcw className="w-5 h-5 shrink-0 mt-0.5" style={{ color: BRAND_COLORS.blue }} />
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{t('results.retakeHeading')}</h3>
              <p className="text-xs text-gray-500 mt-1">{t('results.retakeSub')}</p>
            </div>
          </div>
        }>
          <div className="flex flex-wrap gap-2 pb-1">
            {RIASEC_TYPES.map(type => (
              <button
                key={type}
                onClick={() => onRetakeType(type)}
                className="min-h-11 min-w-[132px] px-3 py-2 rounded-full text-xs font-bold text-center"
                style={{ backgroundColor: RIASEC_COLORS[type], color: contrastText(RIASEC_COLORS[type]) }}
              >
                {t('results.retakeType', { type: t('riasec.label.' + type) })}
              </button>
            ))}
          </div>
        </Collapsible>

        <Collapsible defaultOpen={false} header={
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{t('results.riasecProfile')}</h3>
        }>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">{t('results.radarHowTo')}</p>
          <div className="w-full" style={{ height: 260 }} role="img"
            aria-label={`${t('results.riasecProfile')}: ${ranked.map(r => `${t('riasec.label.' + r.type)} ${r.normalized.toFixed(1)}%`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="type" tickFormatter={(v) => t('riasec.label.' + v)} tick={{ fontSize: 11, fontWeight: 600, fill: '#6b7280' }} />
                <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 'auto']} />
                <Radar name="Score" dataKey="score" stroke={BRAND_COLORS.blue} fill={BRAND_COLORS.blue} fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {/* INK-012: tap a node/type for a one-line description + O*NET link. */}
          <div className="mt-3 flex flex-wrap gap-2">
            {RIASEC_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setRadarInfo(prev => (prev === type ? null : type))}
                aria-expanded={radarInfo === type}
                className="flex min-h-11 items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold text-gray-700"
                style={{ borderColor: RIASEC_COLORS[type] }}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RIASEC_COLORS[type] }} />
                {t('riasec.label.' + type)}
              </button>
            ))}
          </div>
          {radarInfo && (
            <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-4 text-left" role="status">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: RIASEC_COLORS[radarInfo] }} />
                <span className="text-sm font-bold text-gray-800">{t('riasec.label.' + radarInfo)}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{t('riasec.desc.' + radarInfo)}</p>
              <a href={`https://www.onetonline.org/explore/interests/${radarInfo}/`} target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm font-bold" style={{ color: BRAND_COLORS.blue }}>
                {t('results.viewOnet')} <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </Collapsible>

        <Collapsible defaultOpen={false} header={
          <>
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">{t('results.shortlistHeading')} ({shortlist.length})</h3>
            <p className="text-xs text-gray-500 mt-1">{t('results.shortlistSub')}</p>
          </>
        }>
          {shortlist.length > 0 ? (
            <>
              <label className="relative block mt-4">
                <span className="sr-only">{t('results.searchPlaceholder')}</span>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={careerQuery}
                  onChange={(e) => setCareerQuery(e.target.value)}
                  placeholder={t('results.searchPlaceholder')}
                  className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="flex flex-wrap gap-2 py-3">
                {[
                  { id: 'all' as const, label: t('results.allTypes') },
                  { id: 'starred' as const, label: t('results.starred') },
                  ...RIASEC_TYPES.map(type => ({ id: type, label: t('riasec.label.' + type) })),
                ].map(filter => {
                  const active = careerFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setCareerFilter(filter.id)}
                      className={`min-h-11 px-3 py-2 rounded-full text-xs font-bold border ${active ? 'text-white' : 'text-gray-600 bg-white border-gray-200'}`}
                      style={active ? { backgroundColor: BRAND_COLORS.blue, borderColor: BRAND_COLORS.blue } : undefined}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>

              {visibleShortlist.length > 0 ? (
                <div className="space-y-3">
                  {visibleShortlist.map(({ occ, response }) => {
                    const lo = localizeOccupation(occ, lang);
                    const favorite = !!favorites[occ.id];
                    return (
                      <div key={`${response}-${occ.id}`} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 text-sm">{lo.title}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: RIASEC_COLORS[occ.category] }}>
                                {t('riasec.label.' + occ.category)}
                              </span>
                              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${response === 'liked' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {response === 'liked' ? t('results.likedBadge') : t('results.maybeBadge')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setFavorites(prev => ({ ...prev, [occ.id]: !prev[occ.id] }))}
                              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white"
                              aria-label={favorite ? t('results.unfavorite') : t('results.favorite')}
                              aria-pressed={favorite}
                            >
                              <Star className={`w-4 h-4 ${favorite ? 'fill-yellow-400 text-yellow-500' : 'text-gray-400'}`} />
                            </button>
                            <a
                              href={`https://www.onetonline.org/link/summary/${encodeURIComponent(occ.onetCode)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 py-2 text-xs font-bold text-gray-600 hover:bg-white"
                              aria-label={t('results.openCareer', { title: lo.title })}
                            >
                              <ExternalLink className="w-4 h-4 text-gray-500" />
                              <span>O*NET</span>
                            </a>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed mt-2">{lo.description}</p>
                        <textarea
                          value={notes[occ.id] || ''}
                          onChange={(e) => setNotes(prev => ({ ...prev, [occ.id]: e.target.value }))}
                          placeholder={t('results.notePlaceholder')}
                          className="mt-3 w-full min-h-24 resize-y rounded-lg border border-gray-200 bg-white px-3 py-3 text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setFavorites(prev => ({ ...prev, [occ.id]: true }))}
                            className="flex min-h-11 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-1.5 py-2 text-center text-[10px] font-bold leading-tight text-gray-700 hover:bg-gray-50 sm:text-[11px]"
                          >
                            <Star className={`w-3.5 h-3.5 ${favorite ? 'fill-yellow-400 text-yellow-500' : 'text-gray-400'}`} />
                            <span>{favorite ? t('results.saved') : t('results.save')}</span>
                          </button>
                          <button
                            onClick={() => appendNote(occ.id, t('results.askTemplate', { title: lo.title }))}
                            className="flex min-h-11 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-1.5 py-2 text-center text-[10px] font-bold leading-tight text-gray-700 hover:bg-gray-50 sm:text-[11px]"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-gray-500" />
                            <span>{t('results.askThis')}</span>
                          </button>
                          <button
                            onClick={() => appendNote(occ.id, t('results.tryTemplate', { title: lo.title }))}
                            className="flex min-h-11 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-1.5 py-2 text-center text-[10px] font-bold leading-tight text-gray-700 hover:bg-gray-50 sm:text-[11px]"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5 text-gray-500" />
                            <span>{t('results.tryThis')}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-4">{t('results.noMatches')}</p>
              )}

              {filteredShortlist.length > 8 && (
                <button
                  onClick={() => setShortlistExpanded(v => !v)}
                  className="mt-4 w-full py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50"
                >
                  {shortlistExpanded ? t('results.showLess') : t('results.showAll', { n: filteredShortlist.length })}
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500 mt-4">{t('results.likedEmpty')}</p>
          )}
        </Collapsible>

        <Collapsible defaultOpen={false} header={
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{t('results.nextSteps')}</h3>
        }>
          <div className="space-y-3">
            {[t('results.stepClasses'), t('results.stepExplore'), t('results.stepConversation'), t('results.stepTry')].map((step, i) => (
              <div key={step} className="flex gap-3 text-sm text-gray-600 leading-relaxed">
                <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0" style={{ backgroundColor: BRAND_COLORS.orange, color: contrastText(BRAND_COLORS.orange) }}>
                  {i + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </Collapsible>

        {/* FOOTER ACTIONS */}
        <div className="space-y-4 pt-2">
          {!counselorView && (
            <details className="rounded-xl border border-gray-200 bg-white p-3">
              <summary className="flex cursor-pointer list-none items-center justify-center gap-2 text-sm font-bold text-gray-600">
                <Share2 className="w-4 h-4" />
                {t('results.shareApp')}
              </summary>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button onClick={handleShareFacebook} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50" aria-label={t('results.shareFacebook')}>{t('results.facebook')}</button>
                <button onClick={handleShareLinkedIn} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50" aria-label={t('results.shareLinkedIn')}>{t('results.linkedin')}</button>
                <button onClick={handleShareWhatsApp} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50" aria-label={t('results.shareWhatsApp')}>{t('results.whatsapp')}</button>
                <button onClick={handleShareX} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50" aria-label={t('results.shareX')}>{t('results.x')}</button>
                <button onClick={handleCopyLink} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50" aria-label={t('results.copyLink')}>
                  {copied ? t('results.linkCopied') : t('results.copyLink')}
                </button>
              </div>
            </details>
          )}
          <span className="sr-only" role="status" aria-live="polite">{copied ? t('results.linkCopied') : ''}</span>

          <button onClick={onEditResponses}
            className="flex items-center justify-center w-full py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t('results.editResponses')}
          </button>

          <button onClick={onRestart}
            className="flex items-center justify-center w-full py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors gap-2">
            <RefreshCcw className="w-4 h-4" />
            {t('results.startOver')}
          </button>

          <LegalSupport onClearData={onClearData} className="pt-2" />
        </div>

      </div>
    </div>
  );
};
