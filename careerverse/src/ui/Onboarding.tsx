import { useStore } from '../store/useStore';
import { RIASEC } from '../data/riasec';
import { RIASEC_ORDER } from '../types';
import { StarIcon, HandIcon, ScrollIcon, FilterIcon } from './icons';

const STEPS = [
  { icon: StarIcon, text: 'Click a star to make it the sun and see its world' },
  { icon: HandIcon, text: 'Drag empty space to glide across the galaxy' },
  { icon: ScrollIcon, text: 'Scroll or pinch to zoom toward your cursor' },
  { icon: FilterIcon, text: 'Filter by preparation and hop to nearby careers' },
];

/** First-run coach marks. Teaches movement + the colour language up front, so
 *  nothing essential hides in a menu. A stored flag keeps it from re-appearing. */
export function Onboarding() {
  const finish = useStore((s) => s.finishOnboarding);
  const surprise = useStore((s) => s.surprise);

  return (
    <div className="onboard-veil" role="dialog" aria-modal="true" aria-label="Welcome to CareerVerse">
      <div className="onboard-card glass">
        <div className="glyph">✦</div>
        <h2>Welcome to CareerVerse</h2>
        <p>
          Every star is a different future world, coloured by the kind of interest it pulls on.
          This is not a verdict — it’s a neighbourhood of adjacent possibilities to wander.
        </p>

        <div className="coach-steps">
          {STEPS.map((s, i) => (
            <div className="coach-step" key={i}>
              <s.icon />
              <span>{s.text}</span>
            </div>
          ))}
        </div>

        <div className="onboard-legend">
          {RIASEC_ORDER.map((k) => {
            const m = RIASEC[k];
            return (
              <span className="ol-chip" key={k}>
                <span className="sw" style={{ background: m.css }} />
                {m.name}
              </span>
            );
          })}
        </div>

        <div className="onboard-actions">
          <button
            className="btn-primary"
            onClick={() => {
              finish();
              surprise();
            }}
          >
            Start exploring
          </button>
          <button className="btn-ghost" onClick={finish}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
