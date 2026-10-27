import { useEffect, useRef } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

export function useCountUp(target: number, duration = 1800, decimals = 0) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!ref.current) return;
    if (reduced) {
      ref.current.textContent = decimals ? target.toFixed(decimals) : String(target);
      return;
    }
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      const val = target * eased;
      if (ref.current) {
        ref.current.textContent = decimals ? val.toFixed(decimals) : String(Math.round(val));
      }
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else if (ref.current) {
        ref.current.textContent = decimals ? target.toFixed(decimals) : String(target);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration, decimals, reduced]);

  return { ref };
}
