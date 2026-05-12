import { ShieldCheck, ArrowRight } from "lucide-react";

export function GlobalVisibilityBanner() {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800/50 rounded-full flex items-center justify-center shadow-sm shrink-0">
          <ShieldCheck className="text-blue-600 dark:text-blue-400" size={36} strokeWidth={1.2} />
        </div>
        <div>
          <h4 className="text-lg font-bold text-gs-text leading-snug">One platform. Every program. Global visibility.</h4>
          <p className="text-gs-muted text-sm mt-0.5">
            Track readiness, identify risks, and stay aligned across all your regulatory programs and health authority interactions.
          </p>
        </div>
      </div>
      <button className="flex items-center gap-2 px-5 py-2.5 bg-gs-card border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-sm text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all shadow-sm whitespace-nowrap">
        View Program Overview <ArrowRight size={18} />
      </button>
    </div>
  );
}
