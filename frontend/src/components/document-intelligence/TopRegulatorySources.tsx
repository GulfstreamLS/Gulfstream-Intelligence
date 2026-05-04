import { ChevronRight } from "lucide-react";

interface SourceItemProps {
  name: string;
  count: number;
}

function SourceItem({ name, count }: SourceItemProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[13px] font-bold text-gs-muted">{name}</span>
      <span className="bg-gs-bg px-2 py-0.5 rounded text-[11px] font-black text-gs-blue border border-gs-border">
        {count}
      </span>
    </div>
  );
}

export function TopRegulatorySources() {
  return (
    <div className="bg-gs-card p-7 rounded-2xl border border-gs-border shadow-card">
      <h3 className="text-[16px] font-bold text-gs-text mb-6">Top Regulatory Sources</h3>
      <div className="space-y-[10px]">
        <SourceItem name="FDA Guidance"      count={32} />
        <SourceItem name="EMA Guidelines"    count={28} />
        <SourceItem name="ICH Guidelines"    count={18} />
        <SourceItem name="PMDA Guidance"     count={12} />
        <SourceItem name="ISO Standards"     count={10} />
        <SourceItem name="Other Authorities" count={28} />
      </div>
      <button className="text-gs-blue text-[13px] font-bold flex items-center gap-1 mt-6 hover:underline">
        View all sources <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
