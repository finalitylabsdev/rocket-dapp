import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  parallaxFactor: number;
}

interface NebulaPatch {
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
  driftX: number;
  driftY: number;
  currentX: number;
  currentY: number;
}

const NEBULA_COLORS = [
  'rgba(139,92,246,',
  'rgba(6,182,212,',
  'rgba(245,158,11,',
  'rgba(59,130,246,',
  'rgba(34,197,94,',
];

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const starsRef = useRef<Star[]>([]);
  const nebulasRef = useRef<NebulaPatch[]>([]);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
      initNebulas();
    };

    const initStars = () => {
      const count = Math.min(350, Math.floor((canvas.width * canvas.height) / 5000));
      starsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.015 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        parallaxFactor: Math.random() * 0.08 + 0.01,
      }));
    };

    const initNebulas = () => {
      nebulasRef.current = Array.from({ length: 4 }, (_, i) => {
        const color = NEBULA_COLORS[i % NEBULA_COLORS.length];
        const driftAngle = Math.random() * Math.PI * 2;
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 300 + 200,
          color,
          opacity: Math.random() * 0.05 + 0.02,
          driftX: Math.cos(driftAngle) * 0.3,
          driftY: Math.sin(driftAngle) * 0.3,
          currentX: Math.random() * canvas.width,
          currentY: Math.random() * canvas.height,
        };
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX - canvas.width / 2) / canvas.width,
        y: (e.clientY - canvas.height / 2) / canvas.height,
      };
    };

    const draw = () => {
      timeRef.current += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#06080F';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      nebulasRef.current.forEach((n) => {
        n.currentX = (n.currentX + n.driftX + canvas.width) % (canvas.width * 1.2);
        n.currentY = (n.currentY + n.driftY + canvas.height) % (canvas.height * 1.2);

        const grad = ctx.createRadialGradient(n.currentX, n.currentY, 0, n.currentX, n.currentY, n.radius);
        grad.addColorStop(0, `${n.color}${n.opacity})`);
        grad.addColorStop(1, `${n.color}0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      starsRef.current.forEach((star) => {
        const twinkle = Math.sin(timeRef.current * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
        const px = star.x + mx * star.parallaxFactor * 80;
        const py = star.y + my * star.parallaxFactor * 80;

        ctx.beginPath();
        ctx.arc(px, py, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,236,244,${star.opacity * twinkle})`;
        ctx.fill();

        if (star.size > 1.2) {
          ctx.beginPath();
          ctx.arc(px, py, star.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(232,236,244,${star.opacity * twinkle * 0.08})`;
          ctx.fill();
        }
      });

      animFrameRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
