import { RIASEC } from '../data/riasec';
import { RIASEC_ORDER } from '../types';
import type { InterestVector } from '../types';

/** RIASEC interest scores with inline meaning — each row is labelled, coloured,
 *  and the letter badge explains its type on hover (not buried in a menu). */
export function RiasecBars({ interests }: { interests: InterestVector }) {
  const top = [...RIASEC_ORDER].sort((a, b) => interests[b] - interests[a])[0];
  return (
    <div className="riasec-bars">
      {RIASEC_ORDER.map((key) => {
        const m = RIASEC[key];
        const v = interests[key];
        const pct = Math.round((v / 7) * 100);
        return (
          <div className="riasec-row" key={key}>
            <span
              className="rl"
              style={{ background: m.css }}
              title={`${m.name} — ${m.nickname}: ${m.blurb}`}
            >
              {m.letter}
            </span>
            <span className="rname">{m.name}</span>
            <span className="track">
              <span
                className="fill"
                style={{
                  width: `${pct}%`,
                  background: m.css,
                  boxShadow: key === top ? `0 0 10px ${m.css}` : 'none',
                  opacity: key === top ? 1 : 0.78,
                }}
              />
            </span>
            <span className="val">{v.toFixed(1)}</span>
          </div>
        );
      })}
    </div>
  );
}
