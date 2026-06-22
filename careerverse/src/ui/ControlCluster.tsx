import type { Galaxy } from '../engine/Galaxy';
import { useStore } from '../store/useStore';
import { BackIcon, HomeIcon, PlusIcon, MinusIcon, ShuffleIcon } from './icons';

/** Persistent, always-visible navigation. Never hidden in a menu. */
export function ControlCluster({ engine }: { engine: Galaxy | null }) {
  const index = useStore((s) => s.index);
  const back = useStore((s) => s.back);
  const surprise = useStore((s) => s.surprise);
  const canBack = index >= 0;

  return (
    <div className="controls" role="toolbar" aria-label="Navigation controls">
      <button
        className="icon-btn glass"
        onClick={back}
        disabled={!canBack}
        aria-label="Back to previous career"
        title="Back"
      >
        <BackIcon />
      </button>

      <button
        className="icon-btn glass"
        onClick={() => engine?.home()}
        aria-label="Home — frame the whole galaxy"
        title="Home"
      >
        <HomeIcon />
      </button>

      <div className="zoom-group glass">
        <button className="icon-btn" onClick={() => engine?.zoomInButton()} aria-label="Zoom in" title="Zoom in">
          <PlusIcon />
        </button>
        <button className="icon-btn" onClick={() => engine?.zoomOutButton()} aria-label="Zoom out" title="Zoom out">
          <MinusIcon />
        </button>
      </div>

      <button
        className="icon-btn glass"
        onClick={surprise}
        aria-label="Surprise me — jump to a random career"
        title="Surprise me"
      >
        <ShuffleIcon />
      </button>
    </div>
  );
}
