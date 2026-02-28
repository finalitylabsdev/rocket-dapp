import { Rocket } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  subtitle?: string;
}

export default function ComingSoon({ title, subtitle }: ComingSoonProps) {
  return (
    <div className="pt-20 md:pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center mb-4">
          <span className="tag">
            <Rocket size={11} />
            Coming Soon
          </span>
        </div>
        <h1 className="font-mono font-black text-3xl md:text-4xl text-text-primary mb-3 uppercase tracking-wider">
          {title}
        </h1>
        <p className="text-text-muted font-mono">
          {subtitle ?? 'This feature is not yet available. Check back soon.'}
        </p>
      </div>
    </div>
  );
}
