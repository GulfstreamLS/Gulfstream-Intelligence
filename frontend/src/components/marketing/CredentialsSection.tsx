interface Stat {
  value: string;
  label: string;
  sub: string;
}

interface Authority {
  flag: string;
  name: string;
  region: string;
}

const LEFT = {
  label: "BUILT BY REGULATORY EXPERTS. BACKED BY REAL-WORLD EXPERIENCE.",
  description:
    "Decades of global regulatory leadership across FDA, EMA, MHRA, Health Canada, PMDA, TGA, and NMPA—now powered by AI to help you move your program forward.",
};

const RIGHT = {
  label: "GLOBAL PERSPECTIVE. LOCAL EXPERTISE.",
  description:
    "Navigate regulatory pathways with confidence across every major health authority worldwide.",
};

const STATS: Stat[] = [
  { value: "25+",     label: "Years Regulatory",          sub: "Leadership" },
  { value: "Global",  label: "Experience Across",         sub: "Major Health Authorities" },
  { value: "1000+",   label: "Submissions",               sub: "Supported" },
  { value: "Trusted", label: "By Biotech, Pharma &",      sub: "Medtech Device Leaders" },
];

const AUTHORITIES: Authority[] = [
  { flag: "🇺🇸", name: "FDA",           region: "USA" },
  { flag: "🇪🇺", name: "EMA",           region: "EU" },
  { flag: "🇬🇧", name: "MHRA",          region: "UK" },
  { flag: "🇨🇦", name: "Health Canada", region: "Canada" },
  { flag: "🇯🇵", name: "PMDA",          region: "Japan" },
  { flag: "🇦🇺", name: "TGA",           region: "Australia" },
  { flag: "🇨🇳", name: "NMPA",          region: "China" },
];

export function CredentialsSection() {
  return (
    <section className="py-20 lg:py-28 bg-white dark:bg-[#0D1E3A]">
      <div className="gs-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20">

          {/* Left — expertise */}
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-gs-blue leading-relaxed">
                {LEFT.label}
              </p>
              <p className="text-[15px] text-gs-muted leading-relaxed">
                {LEFT.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {STATS.map((stat) => (
                <div key={stat.value} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gs-blue/10 dark:bg-gs-blue/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-black text-gs-blue">✦</span>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-gs-text dark:text-white leading-tight">{stat.value}</p>
                    <p className="text-[11px] text-gs-muted leading-tight mt-0.5">{stat.label}</p>
                    <p className="text-[11px] text-gs-muted leading-tight">{stat.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — global authorities */}
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-gs-blue">
                {RIGHT.label}
              </p>
              <p className="text-[15px] text-gs-muted leading-relaxed">
                {RIGHT.description}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {AUTHORITIES.map((auth) => (
                <div
                  key={auth.name}
                  className="bg-white dark:bg-[#0F2241] border border-gs-border dark:border-white/10 rounded-xl p-3 flex flex-col items-center gap-1.5 text-center hover:shadow-card transition-shadow"
                >
                  <span className="text-2xl leading-none">{auth.flag}</span>
                  <p className="text-[11px] font-bold text-gs-text dark:text-white">{auth.name}</p>
                  <p className="text-[10px] text-gs-muted">{auth.region}</p>
                </div>
              ))}

              {/* More */}
              <div className="bg-gs-bg dark:bg-[#0F2241] border border-gs-border dark:border-white/10 rounded-xl p-3 flex flex-col items-center justify-center gap-1 text-center">
                <span className="text-2xl font-bold text-gs-blue leading-none">+</span>
                <p className="text-[10px] font-semibold text-gs-muted">& More</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
