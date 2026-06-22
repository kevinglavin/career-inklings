import { useEffect, useMemo, useRef, useState } from 'react';
import { searchOccupations } from '../data/search';
import { RIASEC } from '../data/riasec';
import { useStore } from '../store/useStore';
import { SearchIcon, XIcon } from './icons';

export function SearchBar({
  autoFocus,
  onDone,
}: {
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const select = useStore((s) => s.select);

  const results = useMemo(() => searchOccupations(query), [query]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // dismiss on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const choose = (id: string) => {
    select(id);
    setQuery('');
    setOpen(false);
    setActive(0);
    inputRef.current?.blur();
    onDone?.();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      if (results[active]) choose(results[active].id);
    } else if (e.key === 'Escape') {
      if (query) {
        setQuery('');
      } else {
        setOpen(false);
        inputRef.current?.blur();
        onDone?.();
      }
    }
  };

  return (
    <div className="search" ref={wrapRef}>
      <div className="search-field glass">
        <SearchIcon />
        <input
          ref={inputRef}
          value={query}
          placeholder="Search careers…"
          aria-label="Search careers"
          enterKeyHint="search"
          onFocus={(e) => {
            e.target.select(); // select-all so typing replaces; never garbled
            setOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        {query && (
          <button className="icon-btn" style={{ width: 28, height: 28, background: 'none', border: 'none' }} aria-label="Clear search" onClick={() => { setQuery(''); inputRef.current?.focus(); }}>
            <XIcon />
          </button>
        )}
      </div>

      {open && query.trim() !== '' && (
        <div className="search-results" role="listbox">
          {results.length === 0 ? (
            <div className="search-empty">No matching careers. Try “nurse”, “design”, or “engineer”.</div>
          ) : (
            results.map((r, i) => {
              const meta = RIASEC[r.category];
              return (
                <button
                  key={r.id}
                  className={`search-result${i === active ? ' active' : ''}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(r.id)}
                >
                  <span className="star-dot" style={{ color: meta.css, background: meta.css }} />
                  <span className="grow">
                    <div className="title">{r.title}</div>
                    <div className="sub">
                      {meta.name} · {r.onet}
                    </div>
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
