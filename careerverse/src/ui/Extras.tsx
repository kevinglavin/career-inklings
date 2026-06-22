import { useStore } from '../store/useStore';
import { EyeIcon, XIcon } from './icons';

/** Immersive "stars-only" toggle. The inline variant lives in the top bar; the
 *  fixed variant stays reachable in immersive mode when all other UI is hidden. */
export function StarsOnlyToggle({ fixed }: { fixed?: boolean }) {
  const starsOnly = useStore((s) => s.starsOnly);
  const toggle = useStore((s) => s.toggleStarsOnly);
  return (
    <button
      className={`stars-only-btn glass${fixed ? ' stars-only-fixed' : ''}`}
      onClick={toggle}
      aria-pressed={starsOnly}
    >
      {starsOnly ? (
        <>
          <XIcon style={{ width: 16, height: 16 }} /> Exit stars-only
        </>
      ) : (
        <>
          <EyeIcon style={{ width: 16, height: 16 }} /> Stars only
        </>
      )}
    </button>
  );
}

export function Toast() {
  const toast = useStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div className="toast" role="status">
      {toast}
    </div>
  );
}
