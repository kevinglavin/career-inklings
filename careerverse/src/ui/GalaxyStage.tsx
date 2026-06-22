import { useEffect, useRef } from 'react';
import { Galaxy } from '../engine/Galaxy';
import { useStore } from '../store/useStore';

/** Mounts the PixiJS galaxy and wires its picks/hovers back into the store. */
export function GalaxyStage({ onReady }: { onReady: (g: Galaxy) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const engine = new Galaxy();
    let alive = true;

    engine
      .init(el, {
        onPick: (id) => {
          const st = useStore.getState();
          if (id) st.select(id);
          else st.deselect();
        },
        onHoverChange: (id) => useStore.getState().setHover(id),
        onActivity: () => {},
        onReady: () => {
          if (alive) onReady(engine);
        },
      })
      .catch((err) => console.error('Galaxy init failed', err));

    return () => {
      alive = false;
      engine.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} className="galaxy-stage" />;
}
