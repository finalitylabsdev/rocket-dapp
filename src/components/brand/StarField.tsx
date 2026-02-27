export default function StarField() {
  return (
    <div
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: 0,
        backgroundImage:
          'radial-gradient(circle, var(--starfield-dot) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
      aria-hidden="true"
    />
  );
}
