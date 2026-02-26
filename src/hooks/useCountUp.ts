import { useState, useEffect, useRef } from 'react';

interface CountUpOptions {
  end: number;
  duration?: number;
  start?: number;
  decimals?: number;
  delay?: number;
}

export function useCountUp({ end, duration = 2000, start = 0, decimals = 0, delay = 0 }: CountUpOptions) {
  const [value, setValue] = useState(start);
  const [hasStarted, setHasStarted] = useState(false);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => setHasStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!hasStarted) return;

    const startVal = start;
    const endVal = end;

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      const current = startVal + (endVal - startVal) * eased;
      setValue(parseFloat(current.toFixed(decimals)));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [hasStarted, end, start, duration, decimals]);

  return value;
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export function useIntersectionObserver(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    const element = ref.current;
    if (element) observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}
