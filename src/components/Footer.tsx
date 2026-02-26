import { Zap, Github, Twitter, FileText } from 'lucide-react';

export default function Footer() {
  const links = {
    Protocol: ['Whitepaper', 'Docs', 'GitHub', 'Audit Report'],
    Apps: ['Entropy Gate', 'Flux Exchange', 'Star Vault & Nebula Bids', 'Celestial Assembler'],
    Jackpot: ['Quantum Lift-Off', 'Cosmic Jackpot', 'Season 1 Prizes', 'Prize Claim'],
    Community: ['Twitter / X', 'Discord', 'Telegram', 'Blog'],
  };

  return (
    <footer className="bg-bg-card border-t border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-white flex items-center justify-center">
                <Zap size={18} className="text-black" fill="black" />
              </div>
              <div>
                <span className="font-mono font-bold text-white text-lg leading-none uppercase tracking-wider">Entropy</span>
                <div className="text-[10px] font-mono font-medium text-zinc-500 mt-0.5 uppercase tracking-wider">E-Net Testnet</div>
              </div>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mb-6">
              Permission-less. Immutable. Proof-of-Infinity. Lock ETH. Claim Flux. Build rockets. Win real ETH on-chain.
            </p>
            <div className="flex items-center gap-2.5">
              {[
                { icon: <Twitter size={15} />, label: 'Twitter' },
                { icon: <Github size={15} />, label: 'GitHub' },
                { icon: <FileText size={15} />, label: 'Docs' },
              ].map((social, i) => (
                <button
                  key={i}
                  className="w-9 h-9 bg-zinc-900 border border-border-default flex items-center justify-center text-zinc-500 hover:text-white hover:border-border-strong transition-all duration-200"
                  aria-label={social.label}
                >
                  {social.icon}
                </button>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-mono font-bold text-zinc-400 text-sm mb-4 uppercase tracking-wider">{category}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-zinc-600 hover:text-zinc-300 text-sm transition-colors duration-150"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-sm font-mono">
            © 2025 Entropy Protocol. This is a testnet — not financial advice.
          </p>
          <div className="flex items-center gap-2">
            <div className="glow-dot" />
            <span className="text-sm font-mono font-medium text-zinc-500">E-NET v0.9.2 — SEASON 1 ACTIVE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
