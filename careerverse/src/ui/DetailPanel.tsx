import type { Galaxy } from '../engine/Galaxy';
import { GALAXY_DATA } from '../data/occupations';
import { RIASEC, JOB_ZONES } from '../data/riasec';
import { useStore, type JobZoneMode } from '../store/useStore';
import { RiasecBars } from './RiasecBars';
import { XIcon, ShareIcon, EyeIcon, FilterIcon } from './icons';

const ZONE_MODES: { key: JobZoneMode; label: string }[] = [
  { key: 'any', label: 'Any' },
  { key: 'similar', label: 'Similar' },
  { key: 'lower', label: 'Less' },
  { key: 'higher', label: 'More' },
];

export function DetailPanel({ engine }: { engine: Galaxy | null }) {
  const currentId = useStore((s) => s.currentId);
  const select = useStore((s) => s.select);
  const deselect = useStore((s) => s.deselect);
  const jobZone = useStore((s) => s.jobZone);
  const setJobZone = useStore((s) => s.setJobZone);
  const focusMode = useStore((s) => s.focusMode);
  const toggleFocus = useStore((s) => s.toggleFocus);
  const showToast = useStore((s) => s.showToast);

  const star = currentId ? GALAXY_DATA.byId.get(currentId) : null;
  const open = !!star;
  const m = star ? RIASEC[star.category] : RIASEC.Realistic;
  const zone = star ? JOB_ZONES[star.jobZone] : null;

  const copyLink = () => {
    if (!star) return;
    const url = `${location.origin}${location.pathname}?star=${encodeURIComponent(star.id)}`;
    navigator.clipboard?.writeText(url).then(
      () => showToast('Link copied — share this star'),
      () => showToast(url),
    );
  };

  return (
    <aside
      className={`detail${open ? ' open' : ''}`}
      style={{ ['--accent' as string]: m.css }}
      aria-hidden={!open}
    >
      <button className="icon-btn glass detail-close" onClick={deselect} aria-label="Close details">
        <XIcon />
      </button>

      {star && (
        <div className="detail-scroll">
          <div className="detail-head">
            <span className="type-badge">
              <span className="star-dot" style={{ color: m.css, background: m.css, width: 8, height: 8 }} />
              {m.name} · {m.nickname}
            </span>
          </div>
          <h2>{star.title}</h2>
          <div className="onet">O*NET {star.onetCode}</div>
          <p className="desc">{star.description}</p>

          <div className="verdict-note">
            This isn’t a verdict — it’s a neighbourhood. {star.title} sits near the careers below
            because they pull on similar interests, not because any of them is “right” for you.
          </div>

          {/* RIASEC interest profile */}
          <div className="section">
            <h3>
              Interest profile <span className="hint">how strongly each interest pulls · 0–7</span>
            </h3>
            <RiasecBars interests={star.interests} />
          </div>

          {/* Job zone */}
          {zone && (
            <div className="section">
              <h3>Preparation</h3>
              <div className="jobzone">
                <div className="jz-pips" aria-label={`Job Zone ${star.jobZone} of 5`}>
                  {[1, 2, 3, 4, 5].map((p) => (
                    <span key={p} className={`jz-pip${p <= star.jobZone ? ' on' : ''}`} />
                  ))}
                </div>
                <div className="jz-text">
                  <strong>
                    Job Zone {star.jobZone} · {zone.title}
                  </strong>
                  <p>{zone.prep}</p>
                </div>
              </div>
            </div>
          )}

          {/* Nearby careers */}
          <div className="section">
            <h3>
              Nearby careers
              <span className="hint">why each is close</span>
            </h3>

            <div className="jz-filter" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
              <FilterIcon style={{ width: 15, height: 15, color: 'var(--text-dim)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Prep vs. this:</span>
              <div className="segmented" style={{ display: 'flex', gap: 4 }}>
                {ZONE_MODES.map((z) => (
                  <button
                    key={z.key}
                    onClick={() => setJobZone(z.key)}
                    className="pill-btn"
                    style={{
                      padding: '5px 11px',
                      fontSize: 12,
                      background: jobZone === z.key ? 'color-mix(in srgb, var(--accent) 26%, transparent)' : undefined,
                      borderColor: jobZone === z.key ? 'var(--accent)' : undefined,
                    }}
                    aria-pressed={jobZone === z.key}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
            </div>

            {star.neighbours.map((n) => {
              const ns = GALAXY_DATA.byId.get(n.id);
              if (!ns) return null;
              const nm = RIASEC[ns.category];
              return (
                <button key={n.id} className="neighbour" onClick={() => select(n.id)}>
                  <span className="star-dot" style={{ color: nm.css, background: nm.css }} />
                  <span className="nb-main">
                    <span className="nb-title">{ns.title}</span>
                    <span className="nb-reason">{n.reason}</span>
                  </span>
                  <span className="nb-sim">{Math.round(n.similarity * 100)}%</span>
                </button>
              );
            })}
          </div>

          {/* actions */}
          <div className="detail-actions">
            <button className="pill-btn" onClick={copyLink}>
              <ShareIcon /> Copy link
            </button>
            <button
              className="pill-btn"
              onClick={toggleFocus}
              aria-pressed={focusMode}
              style={{
                background: focusMode ? 'color-mix(in srgb, var(--accent) 22%, transparent)' : undefined,
                borderColor: focusMode ? 'var(--accent)' : undefined,
              }}
            >
              <EyeIcon /> {focusMode ? 'Dimming others' : 'Dim others'}
            </button>
            <button className="pill-btn" onClick={() => engine?.flyTo(star.id)}>
              Recenter
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
