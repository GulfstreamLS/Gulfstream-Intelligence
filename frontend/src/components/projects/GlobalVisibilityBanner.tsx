import { ShieldCheck, ArrowRight } from "lucide-react";

export function GlobalVisibilityBanner() {
  return (
    <div className="bg-[#F0F7FF] rounded-xl border border-blue-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center shadow-sm shrink-0">
          <ShieldCheck className="text-blue-600" size={36} strokeWidth={1.2} />
        </div>
        <div>
          <h4 className="text-lg font-bold text-slate-800 leading-snug">One platform. Every program. Global visibility.</h4>
          <p className="text-slate-500 text-sm mt-0.5">
            Track readiness, identify risks, and stay aligned across all your regulatory programs and health authority interactions.
          </p>
        </div>
      </div>
      <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-blue-200 text-blue-600 rounded-sm text-sm font-bold hover:bg-blue-50 transition-all shadow-sm whitespace-nowrap">
        View Program Overview <ArrowRight size={18} />
      </button>
    </div>
  );
}
