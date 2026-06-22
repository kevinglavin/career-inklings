import { useEffect, useState } from 'react';

export type Breakpoint = 'phone' | 'tablet' | 'desktop';

function compute(w: number): Breakpoint {
  if (w <= 680) return 'phone';
  if (w <= 1024) return 'tablet';
  return 'desktop';
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() =>
    compute(typeof window === 'undefined' ? 1280 : window.innerWidth),
  );
  useEffect(() => {
    const onResize = () => setBp(compute(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return bp;
}
