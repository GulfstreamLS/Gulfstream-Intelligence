import { ArrowRight, ChevronRight } from "lucide-react";

interface DomainData {
  label: string;
  value: string;
  val: number;
  color: string;
}

const DOMAINS: DomainData[] = [
  { label: "CMC",          value: "+15%", val: 15,  color: "#10B981" },
  { label: "Non-Clinical", value: "+8%",  val: 8,   color: "#10B981" },
  { label: "Clinical",     value: "-12%", val: -12, color: "#F97316" },
  { label: "Safety",       value: "+5%",  val: 5,   color: "#10B981" },
  { label: "Regulatory",   value: "-18%", val: -18, color: "#EF4444" },
  { label: "Quality",      value: "-5%",  val: -5,  color: "#FBBF24" },
];

// Scale: -30% to +30% maps 0–100%. Center (0%) at 50%.
// grid lines at: 0%=-30%, 25%=-15%, 50%=0%, 75%=+15%, 100%=+30%
const GRID_LINES = [0, 25, 50, 75, 100];

function DomainBar({ label, value, val, color }: DomainData) {
  const position = 50 + val * 1.66;
  const isPositive = val > 0;
  const barWidth = Math.abs(val) * 1.66;
  const barLeft = isPositive ? 50 : position;

  return (
    <div className="flex items-stretch gap-4 group border-b border-[#F1F5F9] last:border-0 py-3">
      <span className="w-24 text-[12px] font-bold text-[#64748B] uppercase tracking-tight leading-none shrink-0 flex items-center">
        {label}
      </span>
      <span className={`w-12 text-[11px] font-black text-right pr-4 shrink-0 flex items-center justify-end ${isPositive ? "text-[#10B981]" : "text-[#EF4444]"}`}>
        {value}
      </span>
      {/* Chart bar area */}
      <div className="flex-1 h-6 relative">
        {/* Vertical grid lines spanning the row */}
        {GRID_LINES.map((pct) => (
          <div
            key={pct}
            className={`absolute inset-y-0 w-px ${pct === 50 ? "bg-[#CBD5E1]" : "bg-[#F1F5F9]"}`}
            style={{ left: `${pct}%` }}
          />
        ))}
        {/* Colored bar from center to value */}
        <div
          className="absolute top-[5px] bottom-[5px] rounded-sm"
          style={{
            backgroundColor: color,
            opacity: 0.2,
            left: `${barLeft}%`,
            width: `${barWidth}%`,
          }}
        />
        {/* Dot at value end */}
        <div
          className="absolute h-[16px] w-[16px] rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all group-hover:scale-125"
          style={{ left: `${position}%`, top: "50%", backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function ReadinessByDomain() {
  return (
    <div className="lg:col-span-6 bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm">
      <div className="flex justify-between items-start mb-8">
        <h3 className="text-[16px] font-bold text-[#1E293B]">Readiness by FDA Domain</h3>
        <div className="flex items-center gap-2">
          <ArrowRight size={14} className="text-[#2563EB]" />
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Difference vs FDA Expectations</span>
        </div>
      </div>

      <div className="relative px-4">
        {/* Column header */}
        <div className="flex items-center gap-4 mb-2">
          <span className="w-24 text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest shrink-0">Domain</span>
          <span className="w-12 shrink-0" />
          {/* Scale labels aligned to grid line positions */}
          <div className="flex-1 relative h-4">
            {[
              { pct: 0,   label: "-30%" },
              { pct: 25,  label: "-15%" },
              { pct: 50,  label: "0%"   },
              { pct: 75,  label: "+15%" },
              { pct: 100, label: "+30%" },
            ].map(({ pct, label }) => (
              <span
                key={pct}
                className="absolute text-[10px] font-bold text-[#CBD5E1] uppercase tracking-[0.2em] -translate-x-1/2"
                style={{ left: `${pct}%` }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Domain rows */}
        <div className="rounded-lg overflow-hidden">
          {DOMAINS.map((d) => (
            <DomainBar key={d.label} {...d} />
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-between mt-4 text-[10px] font-bold uppercase tracking-widest pl-[135px]">
          <span className="text-[#EF4444]">← Below Expectations</span>
          <span className="text-[#10B981]">Above Expectations →</span>
        </div>
      </div>

      <button className="mt-8 text-[#2563EB] text-[13px] font-bold flex items-center gap-1 hover:underline">
        View domain breakdown <ChevronRight size={16} />
      </button>
    </div>
  );
}
