import { breadcrumbTitles, useStore } from '../store/useStore';
import { RIASEC } from '../data/riasec';

export function Breadcrumb() {
  const history = useStore((s) => s.history);
  const index = useStore((s) => s.index);
  const goTo = useStore((s) => s.goTo);

  if (index < 0) return null;
  const crumbs = breadcrumbTitles(history, index);

  return (
    <nav className="breadcrumb" aria-label="Your path">
      <div className="breadcrumb-inner glass">
        <button className="crumb" onClick={() => goTo(-1)} title="Back to the whole galaxy">
          Galaxy
        </button>
        {crumbs.map((c, i) => (
          <span key={`${c.id}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Chevron />
            <button
              className={`crumb${i === index ? ' current' : ''}`}
              onClick={() => goTo(i)}
              aria-current={i === index ? 'page' : undefined}
            >
              <span className="swatch" style={{ background: RIASEC[c.category].css }} />
              {c.title}
            </button>
          </span>
        ))}
      </div>
    </nav>
  );
}

const Chevron = () => (
  <svg className="crumb-sep" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 6 6 6-6 6" />
  </svg>
);
