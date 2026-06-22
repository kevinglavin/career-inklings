import { useEffect, useMemo, useRef } from 'react';
import type { Galaxy } from '../engine/Galaxy';
import { GALAXY_DATA } from '../data/occupations';
import { RIASEC } from '../data/riasec';
import { useStore } from '../store/useStore';

const W = 168;
const H = 124;
const PAD = 12;

export function MiniMap({ engine }: { engine: Galaxy | null }) {
  const currentId = useStore((s) => s.currentId);
  const rectRef = useRef<SVGRectElement>(null);
  const youRef = useRef<SVGGElement>(null);

  // fit galaxy bounds into the minimap box
  const tf = useMemo(() => {
    const b = GALAXY_DATA.bounds;
    const bw = b.maxX - b.minX;
    const bh = b.maxY - b.minY;
    const s = Math.min((W - PAD * 2) / bw, (H - PAD * 2) / bh);
    const ox = (W - bw * s) / 2 - b.minX * s;
    const oy = (H - bh * s) / 2 - b.minY * s;
    return { s, ox, oy };
  }, []);
  const toMini = (x: number, y: number) => ({ x: x * tf.s + tf.ox, y: y * tf.s + tf.oy });

  const stars = useMemo(
    () =>
      GALAXY_DATA.stars.map((st) => {
        const p = toMini(st.x, st.y);
        return { id: st.id, x: p.x, y: p.y, c: RIASEC[st.category].css };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // live viewport rect + "you are here", driven by rAF (no React churn)
  useEffect(() => {
    if (!engine) return;
    let raf = 0;
    const tick = () => {
      const cam = engine.getCameraState();
      const a = toMini(cam.rect.minX, cam.rect.minY);
      const b = toMini(cam.rect.maxX, cam.rect.maxY);
      const rect = rectRef.current;
      if (rect) {
        const x = Math.max(0, Math.min(a.x, b.x));
        const y = Math.max(0, Math.min(a.y, b.y));
        rect.setAttribute('x', String(x));
        rect.setAttribute('y', String(y));
        rect.setAttribute('width', String(Math.min(W, Math.abs(b.x - a.x))));
        rect.setAttribute('height', String(Math.min(H, Math.abs(b.y - a.y))));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  const you = currentId ? GALAXY_DATA.byId.get(currentId) : null;
  const youPos = you ? toMini(you.x, you.y) : null;

  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!engine) return;
    const r = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * W;
    const my = ((e.clientY - r.top) / r.height) * H;
    engine.lookAt((mx - tf.ox) / tf.s, (my - tf.oy) / tf.s);
  };

  return (
    <div className="minimap glass">
      <span className="mm-label">You are here</span>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} onClick={onClick} role="img" aria-label="Mini-map of the galaxy">
        {stars.map((s) => (
          <circle key={s.id} cx={s.x} cy={s.y} r={s.id === currentId ? 2.4 : 1.1} fill={s.c} opacity={s.id === currentId ? 1 : 0.55} />
        ))}
        <rect ref={rectRef} x={0} y={0} width={0} height={0} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.7)" strokeWidth={1} rx={2} />
        {youPos && (
          <g ref={youRef} transform={`translate(${youPos.x} ${youPos.y})`}>
            <circle r={5} fill="none" stroke={RIASEC[you!.category].css} strokeWidth={1.5} opacity={0.9}>
              <animate attributeName="r" values="3.5;6;3.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r={2.4} fill={RIASEC[you!.category].css} />
          </g>
        )}
      </svg>
    </div>
  );
}
