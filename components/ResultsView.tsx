import React, { useState, useRef } from 'react';
import { ExternalLink, Download, ChevronRight, Undo2, Loader2, ArrowLeft, Volume2 } from 'lucide-react';
import { Scores, RiasecType, Occupation } from '../types';
import { RIASEC_COLORS, BRAND_COLORS } from '../constants';
import { computeProfile, Profile, RIASEC_TYPES } from '../careerProfile';
import { localizeOccupation } from '../occupations.es';
import { CompassLogo } from './LoginView';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
// @ts-ignore
import { jsPDF } from 'jspdf';
import { useT } from '../i18n';
import { speak, speechSupported } from '../speech';

interface ResultsViewProps {
  scores: Scores;
  onRestart: () => void;
  onEditResponses: () => void;
  totalCards: number;
  userName: string;
  swipeHistory: Array<{ index: number; direction: 'left' | 'right'; category: RiasecType }>;
  deck: Occupation[];
  likedCards: Occupation[];
}

// Flippable Result Card
const ResultItemCard: React.FC<{ type: RiasecType; score: number; rank: number }> = ({ type, score, rank }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { t } = useT();
  const bgColor = RIASEC_COLORS[type];
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
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: bgColor }}>
              <span className="text-xs">{score}%</span>
            </div>
          </div>
          <p className="text-gray-600 text-base leading-relaxed line-clamp-3 my-2">{t('riasec.desc.' + type)}</p>
          <div className="text-sm font-bold uppercase tracking-wide flex items-center" style={{ color: bgColor }}>
            {t('results.tapToLearn')} <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
        <div className="absolute inset-0 backface-hidden rotate-y-180 text-white rounded-2xl shadow-sm p-5 flex flex-col" style={{ backgroundColor: bgColor }}>
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h4 className="font-bold text-white text-xl">{t('riasec.label.' + type)}</h4>
            <Undo2 className="w-5 h-5 text-white/70" />
          </div>
          <div className="overflow-y-auto custom-scrollbar pr-1 flex-1">
            <p className="text-base leading-relaxed text-white/95">{t('riasec.detail.' + type)}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Hex to RGB helper
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export const ResultsView: React.FC<ResultsViewProps> = ({ scores, onRestart, onEditResponses, totalCards, userName, swipeHistory, deck, likedCards }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const { t, lang } = useT();

  // --- Weighted Profile Computation ---
  const profile = computeProfile(likedCards);
  const { ranked, code: hollandCode, codeTypes, hasTopTie, hasBoundaryTie, tiedTypes } = profile;

  const top3 = codeTypes.slice(0, 3);
  const displayName = userName || t('results.defaultName');

  // O*NET link: point at the single top interest, not the multi-type path
  const topInterestType = top3.length > 0 ? top3[0].type : '';
  const onetUrl = topInterestType
    ? `https://www.onetonline.org/explore/interests/${topInterestType}/`
    : 'https://www.onetonline.org/';

  // For the score breakdown bar chart
  const maxScore = ranked[0]?.score || 1;
  const totalLikes = profile.likedCount;
  const likedSeen = new Set<string>();
  const likedUnique: Occupation[] = likedCards.filter(o => {
    if (likedSeen.has(o.id)) return false;
    likedSeen.add(o.id);
    return true;
  });
  const spokenResults = hollandCode
    ? t('report.spoken', { code: hollandCode.split('').join(', '), n: totalLikes, total: totalCards, types: top3.map(x => t('riasec.label.' + x.type)).join(', ') })
    : t('results.noSignificant');

  // Radar chart data
  const radarData = RIASEC_TYPES.map(t => ({
    type: t,
    score: profile.totals[t],
    normalized: ranked.find(r => r.type === t)?.normalized || 0,
  }));

  // --- Share Handlers ---
  const currentUrl = window.location.href;
  const shareText = t('results.shareText', { code: hollandCode });
  const handleShareFacebook = () => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank'); };
  const handleShareLinkedIn = () => { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`, '_blank'); };
  const handleShareWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + currentUrl)}`, '_blank'); };
  const handleShareX = () => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`, '_blank'); };
  const [copied, setCopied] = useState(false);
  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(currentUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* fallback */ }
  };

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
    <div className="flex flex-col h-full bg-white relative">

      {/* --- HEADER --- */}
      <div className="pt-12 pb-4 px-6 text-center border-b border-gray-100 bg-white shrink-0 z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CompassLogo size={28} />
          <h1 className="text-lg font-bold text-gray-900">Inklings</h1>
        </div>
        <h2 className="text-base font-semibold text-gray-500">{t('results.title')}</h2>
        {userName && <p className="text-sm text-gray-500 mt-1">{t('results.for', { name: userName })}</p>}
        {speechSupported && (
          <button onClick={() => speak(spokenResults, lang)} aria-label={t('results.readResults')}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <Volume2 className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* --- SCROLLABLE CONTENT --- */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-5 py-6 space-y-6 pb-24 bg-gray-50">

        {/* 1. HOLLAND CODE */}
        <div className="text-center bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-bold tracking-widest text-xs uppercase mb-3">{t('results.interestCode')}</h3>
          <div className="text-6xl font-black tracking-wider mb-3" style={{ color: BRAND_COLORS.blue }}>{hollandCode || '---'}</div>
          <p className="text-sm text-gray-500">{t('results.likedOf', { n: totalLikes, total: totalCards })}</p>
          {hasTopTie && <p className="text-xs text-gray-500 mt-2">{t('results.topTie')}</p>}
          {hasBoundaryTie && !hasTopTie && <p className="text-xs text-gray-500 mt-2">{t('results.boundaryTie')}</p>}
        </div>

        {/* 2. PRIMARY CTA */}
        <a href={onetUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center w-full py-4 text-white rounded-xl font-bold transition-transform active:scale-95 shadow-lg hover:opacity-90"
          style={{ backgroundColor: BRAND_COLORS.blue }}>
          <span>{t('results.viewMatching')}</span>
          <ExternalLink className="w-5 h-5 ml-2" />
        </a>

        {/* LIKED CAREERS SHORTLIST */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-1">{t('results.likedHeading')} ({likedUnique.length})</h3>
          {likedUnique.length > 0 ? (
            <>
              <p className="text-xs text-gray-500 mb-3">{t('results.likedSub')}</p>
              <div className="space-y-2">
                {likedUnique.map(occ => {
                  const lo = localizeOccupation(occ, lang);
                  return (
                  <a key={occ.id} href={`https://www.onetonline.org/link/summary/${encodeURIComponent(occ.onetCode)}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{lo.title}</p>
                      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: RIASEC_COLORS[occ.category] }}>{t('riasec.label.' + occ.category)}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500 shrink-0" />
                  </a>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">{t('results.likedEmpty')}</p>
          )}
        </div>

        {/* 3. TOP INTERESTS */}
        <div>
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-3">{t('results.topInterests')}</h3>
          <div className="space-y-3">
            {top3.length > 0 ? top3.map((item, i) => (
              <ResultItemCard key={item.type} type={item.type} score={Math.round(item.normalized * 10) / 10} rank={i} />
            )) : (
              <div className="p-6 bg-white rounded-xl text-center text-gray-500">{t('results.noSignificant')}</div>
            )}
          </div>
        </div>

        {/* 4. RIASEC RADAR */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">{t('results.riasecProfile')}</h3>
          <div className="w-full" style={{ height: 260 }} role="img"
            aria-label={`${t('results.riasecProfile')}: ${ranked.map(r => `${t('riasec.label.' + r.type)} ${r.normalized}%`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="type" tickFormatter={(v) => t('riasec.label.' + v)} tick={{ fontSize: 11, fontWeight: 600, fill: '#6b7280' }} />
                <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 'auto']} />
                <Radar name="Score" dataKey="score" stroke={BRAND_COLORS.blue} fill={BRAND_COLORS.blue} fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. SCORE BREAKDOWN */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-5 uppercase tracking-wide">{t('results.fullBreakdown')}</h3>
          <div className="space-y-3" role="list">
            {ranked.map((item) => {
              const visualPercent = maxScore > 0 ? (item.score / maxScore) * 100 : 0;
              return (
                <div key={item.type} className="flex items-center gap-3" role="listitem"
                  aria-label={`${t('riasec.label.' + item.type)} ${item.normalized}%`}>
                  <div className="w-24 text-xs font-bold text-gray-500 uppercase text-right" aria-hidden="true">{t('riasec.label.' + item.type)}</div>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden" aria-hidden="true">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: RIASEC_COLORS[item.type] }}
                      initial={{ width: 0 }} animate={{ width: `${visualPercent}%` }} transition={{ duration: 0.6, delay: 0.1 }} />
                  </div>
                  <div className="w-16 text-right leading-tight" aria-hidden="true">
                    <div className="text-xs font-bold text-gray-900">{item.normalized}%</div>
                    <div className="text-[10px] font-medium text-gray-500">{Math.round(item.score * 10) / 10} {t('results.pts')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="space-y-4 pt-2">
          {/* Share row */}
          <div className="flex justify-center gap-3 flex-wrap">
            {/* Facebook - brand blue */}
            <button onClick={handleShareFacebook} className="w-12 h-12 rounded-full border border-gray-200 hover:opacity-80 flex items-center justify-center transition-opacity shadow-sm bg-white" aria-label="Share on Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </button>
            {/* LinkedIn - brand blue */}
            <button onClick={handleShareLinkedIn} className="w-12 h-12 rounded-full border border-gray-200 hover:opacity-80 flex items-center justify-center transition-opacity shadow-sm bg-white" aria-label="Share on LinkedIn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </button>
            {/* WhatsApp - brand green */}
            <button onClick={handleShareWhatsApp} className="w-12 h-12 rounded-full border border-gray-200 hover:opacity-80 flex items-center justify-center transition-opacity shadow-sm bg-white" aria-label="Share on WhatsApp">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </button>
            {/* X / Twitter - black */}
            <button onClick={handleShareX} className="w-12 h-12 rounded-full border border-gray-200 hover:opacity-80 flex items-center justify-center transition-opacity shadow-sm bg-white" aria-label="Share on X">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </button>
            {/* Copy Link */}
            <button onClick={handleCopyLink} className="w-12 h-12 rounded-full border border-gray-200 hover:opacity-80 flex items-center justify-center transition-opacity shadow-sm bg-white" aria-label="Copy link">
              {copied ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              )}
            </button>
            {/* Download PDF - dark */}
            <button onClick={handleDownloadPdf} disabled={isGeneratingPdf}
              className="w-12 h-12 rounded-full border border-gray-200 hover:opacity-80 flex items-center justify-center transition-opacity shadow-sm bg-white disabled:opacity-50" aria-label="Download PDF report">
              {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin text-gray-500" /> : <Download className="w-5 h-5 text-gray-900" />}
            </button>
          </div>

          {/* Screen-reader announcement for copy-link */}
          <span className="sr-only" role="status" aria-live="polite">{copied ? t('results.linkCopied') : ''}</span>

          {/* PDF generation error (localized, inline) */}
          {pdfError && <p className="text-center text-sm text-red-600" role="alert">{t('results.pdfError')}</p>}

          {/* Edit Responses button */}
          <button onClick={onEditResponses}
            className="flex items-center justify-center w-full py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t('results.editResponses')}
          </button>

          {/* Restart */}
          <button onClick={onRestart}
            className="flex items-center justify-center w-full py-3 text-gray-500 hover:text-gray-600 font-medium text-sm transition-colors">
            {t('results.startOver')}
          </button>
        </div>

      </div>
    </div>
  );
};
