import { useMemo } from 'react';

interface Particle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  symbol: string;
}

export default function FloatingParticles() {
  const particles = useMemo<Particle[]>(() => {
    const symbols = ['◆', '●', '▲', '✦', '⬡', '◉'];
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 6 + Math.random() * 10,
      duration: 8 + Math.random() * 14,
      delay: -(Math.random() * 20),
      opacity: 0.04 + Math.random() * 0.08,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(110vh) rotate(0deg); opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { transform: translateY(-10vh) rotate(360deg); opacity: 0; }
        }
        @keyframes floatDrift {
          0%   { transform: translateY(110vh) translateX(0px) rotate(0deg); opacity: 0; }
          5%   { opacity: 1; }
          50%  { transform: translateY(50vh) translateX(30px) rotate(180deg); }
          95%  { opacity: 1; }
          100% { transform: translateY(-10vh) translateX(-20px) rotate(360deg); opacity: 0; }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bottom-0 text-white select-none"
          style={{
            left: `${p.x}%`,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            animation: `${p.id % 2 === 0 ? 'floatUp' : 'floatDrift'} ${p.duration}s linear ${p.delay}s infinite`,
          }}
        >
          {p.symbol}
        </div>
      ))}
    </div>
  );
}
