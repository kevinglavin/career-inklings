import { useEffect, useRef, useState } from 'react';
import type { Galaxy } from './engine/Galaxy';
import { GalaxyStage } from './ui/GalaxyStage';
import { TopBar } from './ui/TopBar';
import { Breadcrumb } from './ui/Breadcrumb';
import { ControlCluster } from './ui/ControlCluster';
import { MiniMap } from './ui/MiniMap';
import { DetailPanel } from './ui/DetailPanel';
import { HoverTooltip } from './ui/HoverTooltip';
import { Onboarding } from './ui/Onboarding';
import { StarsOnlyToggle, Toast } from './ui/Extras';
import { useStore } from './store/useStore';
import { useGalaxySync } from './hooks/useGalaxySync';
import { GALAXY_DATA } from './data/occupations';

export function App() {
  const [engine, setEngine] = useState<Galaxy | null>(null);
  const starsOnly = useStore((s) => s.starsOnly);
  const onboarded = useStore((s) => s.onboarded);
  useGalaxySync(engine);

  // respect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => useStore.getState().setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // deep link: ?star=<id>
  const linked = useRef(false);
  useEffect(() => {
    if (!engine || linked.current) return;
    linked.current = true;
    const id = new URLSearchParams(location.search).get('star');
    if (id && GALAXY_DATA.byId.has(id)) {
      useStore.getState().finishOnboarding();
      setTimeout(() => useStore.getState().select(id), 150);
    }
  }, [engine]);

  // keyboard: arrows pan, +/- zoom, Esc deselect, h Home, b Back
  useEffect(() => {
    if (!engine) return;
    const pressed = new Set<string>();
    const isTyping = () => {
      const el = document.activeElement;
      return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
    };
    const updateVec = () => {
      let x = 0;
      let y = 0;
      if (pressed.has('ArrowLeft')) x += 1;
      if (pressed.has('ArrowRight')) x -= 1;
      if (pressed.has('ArrowUp')) y += 1;
      if (pressed.has('ArrowDown')) y -= 1;
      engine.keyPan(x, y);
    };
    const onKey = (e: KeyboardEvent) => {
      if (isTyping()) return;
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'ArrowDown':
          pressed.add(e.key);
          updateVec();
          e.preventDefault();
          break;
        case '+':
        case '=':
          engine.keyZoom(true);
          break;
        case '-':
        case '_':
          engine.keyZoom(false);
          break;
        case 'Escape':
          useStore.getState().deselect();
          break;
        case 'h':
        case 'H':
          engine.home();
          break;
        case 'b':
        case 'B':
          useStore.getState().back();
          break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (pressed.delete(e.key)) updateVec();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      engine.keyPan(0, 0);
    };
  }, [engine]);

  return (
    <div className="app">
      <GalaxyStage onReady={setEngine} />

      {!starsOnly && (
        <>
          <TopBar />
          <Breadcrumb />
          <ControlCluster engine={engine} />
          <MiniMap engine={engine} />
          <DetailPanel engine={engine} />
        </>
      )}

      {starsOnly && <StarsOnlyToggle fixed />}

      <HoverTooltip />
      <Toast />
      {!onboarded && <Onboarding />}
    </div>
  );
}
