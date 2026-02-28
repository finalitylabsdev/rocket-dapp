import { Lock } from 'lucide-react';

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
      className="mt-5 flex items-center gap-4 border px-5 py-3"
      style={{
        background: 'rgba(245,158,11,0.06)',
        borderColor: 'rgba(245,158,11,0.18)',
      }}
    >
      <div className="shrink-0 flex items-center gap-2.5">
        <Lock size={15} className="text-text-primary" />
        <span className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-text-primary whitespace-nowrap">
          {title}
        </span>
      </div>
      <p className="text-sm font-mono text-text-muted truncate">
        {message}
      </p>
    </div>
  );
}
