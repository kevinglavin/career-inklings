import { useEffect } from 'react';
import type { Galaxy } from '../engine/Galaxy';
import { computeVisibleIds, useStore } from '../store/useStore';
import { CAMERA } from '../config';

/**
 * One-way bridge: Zustand state → engine. The engine reports picks/hovers back
 * through callbacks set at creation (see GalaxyStage), so this hook only pushes.
 */
export function useGalaxySync(engine: Galaxy | null) {
  const currentId = useStore((s) => s.currentId);
  const focusMode = useStore((s) => s.focusMode);
  const jobZone = useStore((s) => s.jobZone);
  const reducedMotion = useStore((s) => s.reducedMotion);

  // selection change → highlight + constellation + eased camera arrival
  useEffect(() => {
    if (!engine) return;
    const phone = window.innerWidth <= 680;
    const focusY = phone ? 0.36 : 0.5 - CAMERA.SELECT_VERTICAL_BIAS;
    engine.setSelection(currentId, {
      dim: useStore.getState().focusMode,
      ease: true,
      focusY,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, currentId]);

  // dim toggle (no camera move)
  useEffect(() => {
    engine?.setDim(focusMode);
  }, [engine, focusMode]);

  // job-zone filter
  useEffect(() => {
    engine?.setVisibleIds(computeVisibleIds(currentId, jobZone));
  }, [engine, currentId, jobZone]);

  // reduced motion
  useEffect(() => {
    engine?.setReducedMotion(reducedMotion);
  }, [engine, reducedMotion]);
}
