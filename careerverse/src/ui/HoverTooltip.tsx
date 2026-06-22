import { useEffect, useRef } from 'react';
import { GALAXY_DATA } from '../data/occupations';
import { RIASEC } from '../data/riasec';
import { useStore } from '../store/useStore';

/** Cursor-tracking tooltip. Position is written straight to the DOM on
 *  pointermove (no re-render); only the content depends on React state. */
export function HoverTooltip() {
  const hoverId = useStore((s) => s.hoverId);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (el) {
        el.style.left = `${e.clientX}px`;
        el.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  const star = hoverId ? GALAXY_DATA.byId.get(hoverId) : null;
  const m = star ? RIASEC[star.category] : null;

  return (
    <div ref={ref} className="hover-tip" style={{ opacity: star ? 1 : 0 }}>
      {star && m && (
        <>
          <span className="star-dot" style={{ color: m.css, background: m.css, width: 9, height: 9 }} />
          {star.title}
          <span className="sub">{m.name}</span>
        </>
      )}
    </div>
  );
}
