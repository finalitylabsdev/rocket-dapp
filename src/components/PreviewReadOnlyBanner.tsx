import { AlertTriangle } from 'lucide-react';

interface PreviewReadOnlyBannerProps {
  title: string;
  message: string;
}

export default function PreviewReadOnlyBanner({
  title,
  message,
}: PreviewReadOnlyBannerProps) {
  return (
    <div
      className="mt-5 flex items-start gap-3 border px-4 py-3"
      style={{
        background: 'rgba(245,158,11,0.08)',
        borderColor: 'rgba(245,158,11,0.22)',
      }}
    >
      <AlertTriangle size={16} className="mt-0.5 text-amber-300" />
      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200">
          {title}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          {message}
        </p>
      </div>
    </div>
  );
}
