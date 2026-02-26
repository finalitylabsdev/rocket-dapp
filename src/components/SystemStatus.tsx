import { useEffect, useRef, useState } from 'react';
import { TrendingUp, Layers, Droplets, Activity, ChevronUp } from 'lucide-react';
import { useIntersectionObserver } from '../hooks/useCountUp';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  isVisible: boolean;
}

function AnimatedCounter({ end, duration = 2200, decimals = 0, prefix = '', suffix = '', isVisible }: AnimatedCounterProps) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;
    startTimeRef.current = 0;

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = end * eased;
      setValue(parseFloat(current.toFixed(decimals)));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isVisible, end, duration, decimals]);

  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return <span>{prefix}{formatted}{suffix}</span>;
}

export default function SystemStatus() {
  const { ref, isVisible } = useIntersectionObserver(0.2);

  const stats = [
    {
      label: 'Total ETH Locked in Entropy Gate',
      value: 4729.83,
      decimals: 2,
      prefix: '',
      suffix: ' ETH',
      icon: <Layers size={20} className="text-white" />,
      change: '+12.4%',
      sub: 'across 2,400 whitelisted wallets',
    },
    {
      label: 'Total Flux Supply',
      value: 8394201,
      decimals: 0,
      prefix: '',
      suffix: ' FLUX',
      icon: <TrendingUp size={20} className="text-white" />,
      change: '+8.2%',
      sub: 'minted since genesis',
    },
    {
      label: 'UVD Pool Reserves',
      value: 1247590.42,
      decimals: 2,
      prefix: '$',
      suffix: '',
      icon: <Droplets size={20} className="text-white" />,
      change: '+5.7%',
      sub: 'sₜ index: 0.9983',
    },
  ];

  return (
    <section id="status" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div
          ref={ref}
          className={`bg-bg-card rounded-4xl border border-border-default overflow-hidden transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="p-8 md:p-10 border-b border-border-subtle">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="glow-dot" />
                  <span className="text-sm font-semibold text-dot-green">All Systems Operational</span>
                </div>
                <h2 className="section-title">System Status</h2>
                <p className="text-zinc-500 mt-1 text-sm">Live protocol metrics — updated every block</p>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900 border border-border-default rounded-2xl px-4 py-2.5">
                <Activity size={15} className="text-white animate-pulse" />
                <span className="text-sm font-semibold text-zinc-300">Live Feed</span>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="relative rounded-3xl bg-zinc-900 border border-border-default p-6 overflow-hidden transition-all duration-300 hover:bg-bg-card-hover hover:border-border-strong hover:-translate-y-0.5"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-border-strong flex items-center justify-center">
                      {stat.icon}
                    </div>
                    <div className="flex items-center gap-1 bg-zinc-800/80 border border-border-default rounded-full px-2.5 py-1">
                      <ChevronUp size={11} className="text-dot-green" />
                      <span className="text-xs font-semibold text-dot-green">{stat.change}</span>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="font-poppins font-black text-2xl text-white leading-none tabular-nums">
                      <AnimatedCounter
                        end={stat.value}
                        decimals={stat.decimals}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                        isVisible={isVisible}
                        duration={2200 + i * 200}
                      />
                    </div>
                  </div>

                  <p className="text-sm font-medium text-zinc-300 leading-tight">{stat.label}</p>
                  <p className="text-xs text-zinc-600 mt-1">{stat.sub}</p>

                  <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full bg-white/[0.02] border border-white/[0.04]" />
                  <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-white/[0.01]" />
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Active Validators', val: '48' },
                { label: 'Avg Block Time', val: '2.1s' },
                { label: 'Finality', val: '~6s' },
                { label: 'Network TPS', val: '420' },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 border border-border-subtle rounded-2xl p-4 text-center">
                  <p className="font-poppins font-bold text-white text-lg">{item.val}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
