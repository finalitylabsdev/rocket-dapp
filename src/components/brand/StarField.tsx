import { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface Particle {
  angle: number;
  distance: number;
  growth: number;
  opacity: number;
  pulseOffset: number;
  size: number;
  speed: number;
}

function createParticle(maxRadius: number, spread = 0.72): Particle {
  return {
    angle: Math.random() * Math.PI * 2,
    distance: Math.random() * maxRadius * spread,
    size: 0.28 + Math.random() * 0.72,
    speed: 0.32 + Math.random() * 0.88,
    growth: 0.01 + Math.random() * 0.02,
    opacity: 0.16 + Math.random() * 0.16,
    pulseOffset: Math.random() * Math.PI * 2,
  };
}

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme, ambientFxEnabled } = useTheme();

  useEffect(() => {
    if (!ambientFxEnabled) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const particles: Particle[] = [];
    const isDark = theme === 'dark';
    const particleColor = isDark ? 'rgba(232, 242, 255, 0.55)' : 'rgba(46, 58, 84, 0.2)';
    const trailColor = isDark ? 'rgba(245, 95, 217, 0.028)' : 'rgba(148, 217, 56, 0.04)';
    const accentColor = isDark ? 'rgba(184, 255, 85, 0.06)' : 'rgba(238, 93, 196, 0.028)';

    let animationFrame = 0;
    let frame = 0;
    let width = 0;
    let height = 0;
    let maxRadius = 0;

    const respawnParticle = (particle: Particle, spread = 0.08) => {
      const next = createParticle(maxRadius, spread);
      particle.angle = next.angle;
      particle.distance = next.distance;
      particle.size = next.size;
      particle.speed = next.speed;
      particle.growth = next.growth;
      particle.opacity = next.opacity;
      particle.pulseOffset = next.pulseOffset;
    };

    const buildParticles = () => {
      particles.length = 0;
      const density = isDark ? 26000 : 32000;
      const count = Math.max(16, Math.round((width * height) / density));

      for (let index = 0; index < count; index += 1) {
        particles.push(createParticle(maxRadius));
      }
    };

    const setCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      maxRadius = Math.hypot(width, height) * 0.68;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      buildParticles();
    };

    const handleMouseMove = (event: MouseEvent) => {
      pointer.targetX = width > 0 ? event.clientX / width - 0.5 : 0;
      pointer.targetY = height > 0 ? event.clientY / height - 0.5 : 0;
    };

    const handleBlur = () => {
      pointer.targetX = 0;
      pointer.targetY = 0;
    };

    const drawBackgroundGlow = () => {
      const glow = context.createRadialGradient(
        width * 0.5 + pointer.x * width * 0.04,
        height * 0.5 + pointer.y * height * 0.04,
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.52,
      );

      glow.addColorStop(0, accentColor);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
    };

    const drawParticles = () => {
      pointer.x += (pointer.targetX - pointer.x) * 0.035;
      pointer.y += (pointer.targetY - pointer.y) * 0.035;

      context.clearRect(0, 0, width, height);
      drawBackgroundGlow();

      frame += 1;
      const centerX = width * 0.5 + pointer.x * width * 0.035;
      const centerY = height * 0.5 + pointer.y * height * 0.035;
      const pointerBend = Math.atan2(pointer.y, pointer.x || 0.0001) * 0.008;

      for (const particle of particles) {
        const previousDistance = particle.distance;
        const travel = Math.min(1, particle.distance / maxRadius);
        const angle = particle.angle + pointer.x * 0.05 * (1 - travel) + pointerBend;

        particle.distance += particle.speed * (1 + travel * 0.9);
        particle.speed *= 1.002;
        particle.size += particle.growth * (0.35 + travel * 1.4);

        const prevX = centerX + Math.cos(angle) * previousDistance;
        const prevY = centerY + Math.sin(angle) * previousDistance;
        const drawX = centerX + Math.cos(angle) * particle.distance;
        const drawY = centerY + Math.sin(angle) * particle.distance;

        if (
          particle.distance > maxRadius
          || drawX < -40
          || drawX > width + 40
          || drawY < -40
          || drawY > height + 40
        ) {
          respawnParticle(particle);
          continue;
        }

        const twinkle = 0.8 + Math.sin(frame * 0.03 + particle.pulseOffset) * 0.16;
        const alpha = Math.min(
          1,
          particle.opacity * (isDark ? 0.42 + travel * 0.38 : 0.62 + travel * 0.48) * twinkle,
        );
        const headSize = Math.max(0.5, particle.size);
        const trailLength = Math.max(
          headSize * 2,
          Math.hypot(drawX - prevX, drawY - prevY) * (2.4 + travel * 5.4),
        );
        const trailThickness = Math.max(0.35, headSize * (0.55 + travel * 0.3));

        context.save();
        context.translate(drawX, drawY);
        context.rotate(angle);

        context.fillStyle = trailColor;
        context.globalAlpha = alpha * (isDark ? 0.34 : 0.48);
        context.fillRect(-trailLength, -trailThickness * 0.5, trailLength, trailThickness);

        context.fillStyle = particleColor;
        context.globalAlpha = alpha;
        context.fillRect(-headSize * 0.5, -headSize * 0.5, headSize, headSize);
        context.restore();
      }

      context.globalAlpha = 1;
      animationFrame = window.requestAnimationFrame(drawParticles);
    };

    setCanvasSize();
    drawParticles();

    window.addEventListener('resize', setCanvasSize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('blur', handleBlur);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', setCanvasSize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('blur', handleBlur);
      context.clearRect(0, 0, width, height);
    };
  }, [ambientFxEnabled, theme]);

  const baseBackground = theme === 'dark'
    ? [
        'radial-gradient(circle at 16% 18%, rgba(184, 255, 85, 0.09) 0%, rgba(184, 255, 85, 0) 34%)',
        'radial-gradient(circle at 84% 14%, rgba(245, 95, 217, 0.08) 0%, rgba(245, 95, 217, 0) 30%)',
        'radial-gradient(circle at 50% 100%, rgba(96, 165, 250, 0.06) 0%, rgba(96, 165, 250, 0) 42%)',
        'radial-gradient(circle, rgba(232, 242, 255, 0.03) 1px, transparent 1.6px)',
      ].join(', ')
    : [
        'radial-gradient(circle at 12% 18%, rgba(148, 217, 56, 0.13) 0%, rgba(148, 217, 56, 0) 32%)',
        'radial-gradient(circle at 84% 12%, rgba(238, 93, 196, 0.11) 0%, rgba(238, 93, 196, 0) 26%)',
        'radial-gradient(circle at 50% 100%, rgba(147, 197, 253, 0.12) 0%, rgba(147, 197, 253, 0) 40%)',
        'radial-gradient(circle, rgba(23, 28, 40, 0.03) 1px, transparent 1.8px)',
      ].join(', ');

  return (
    <div
      className="fixed inset-0 h-full w-full overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: baseBackground,
          backgroundSize: theme === 'dark'
            ? 'auto, auto, auto, 72px 72px'
            : 'auto, auto, auto, 88px 88px',
          opacity: ambientFxEnabled ? 0.88 : 0.5,
          transition: 'opacity 500ms ease',
        }}
      />
      {ambientFxEnabled && <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />}
    </div>
  );
}
