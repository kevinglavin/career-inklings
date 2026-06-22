import { useState } from 'react';
import { SearchBar } from './SearchBar';
import { Legend } from './Legend';
import { StarsOnlyToggle } from './Extras';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { SearchIcon, XIcon } from './icons';

export function TopBar() {
  const bp = useBreakpoint();
  const phone = bp === 'phone';
  const [sheet, setSheet] = useState(false);

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <h1>
            Career<span className="dot">Verse</span>
          </h1>
          <small>every star is a future world</small>
        </div>

        {!phone && <SearchBar />}

        <div className="topbar-spacer" />

        {!phone && <Legend className="legend-inline" />}
        {!phone && <StarsOnlyToggle />}

        {phone && (
          <button className="icon-btn" aria-label="Search careers" onClick={() => setSheet(true)}>
            <SearchIcon />
          </button>
        )}
      </header>

      {phone && sheet && (
        <div className="search-sheet" onMouseDown={(e) => { if (e.target === e.currentTarget) setSheet(false); }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <SearchBar autoFocus onDone={() => setSheet(false)} />
            <button className="icon-btn" aria-label="Close search" onClick={() => setSheet(false)}>
              <XIcon />
            </button>
          </div>
          <Legend />
        </div>
      )}
    </>
  );
}
