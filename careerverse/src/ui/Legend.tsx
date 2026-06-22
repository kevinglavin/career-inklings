import { RIASEC } from '../data/riasec';
import { RIASEC_ORDER } from '../types';

/** Always-visible RIASEC colour key. Each chip explains its type on hover/focus
 *  so a first-timer learns the galaxy's colour language without opening a menu. */
export function Legend({ className = '' }: { className?: string }) {
  return (
    <div className={`legend glass ${className}`} role="group" aria-label="RIASEC colour key">
      {RIASEC_ORDER.map((key) => {
        const m = RIASEC[key];
        return (
          <div
            className="legend-chip"
            key={key}
            tabIndex={0}
            style={{ ['--chip-color' as string]: m.css }}
          >
            <span className="swatch" />
            <span>{m.letter}</span>
            <div className="legend-pop" role="tooltip">
              <strong>
                {m.name} · <span className="nick">{m.nickname}</span>
              </strong>
              <p>{m.blurb}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
