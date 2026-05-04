"use client";

import { useState } from "react";
import { CheckCircle2, Globe, Edit3, ArrowRight } from "lucide-react";

function RegionCard({
  flag, name, sub, active, onClick,
}: {
  flag: string; name: string; sub: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-[105px] h-[105px] rounded-xl border-2 cursor-pointer transition-all ${
        active
          ? "border-[#2563EB] bg-blue-50/50 shadow-sm ring-1 ring-blue-100"
          : "border-[#F1F5F9] bg-white hover:border-[#E2E8F0]"
      }`}
    >
      <div className="relative">
        <span className="text-[34px] mb-2 block leading-none">{flag}</span>
        {active && (
          <div className="absolute -top-1 -right-2 bg-[#2563EB] text-white rounded-full p-0.5 shadow-sm border border-white">
            <CheckCircle2 size={12} />
          </div>
        )}
      </div>
      <span className="text-[12px] font-bold text-[#0F172A] tracking-wider leading-none">{name}</span>
      <span className="text-[10px] font-bold text-[#94A3B8] uppercase mt-1 leading-none">{sub}</span>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-[#F8FAFC] pb-4 last:border-0">
      <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">{label}</span>
      <span className="text-[12px] font-bold text-[#475569] uppercase tracking-tighter">{value}</span>
    </div>
  );
}

export function RegionSelectionPanel() {
  const [selectedRegion, setSelectedRegion] = useState("FDA");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      {/* Region selector */}
      <div className="lg:col-span-9 bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm">
        <h2 className="text-[16px] font-bold text-[#1E293B] mb-1">1. Select region or health authority</h2>
        <p className="text-[13px] text-[#94A3B8] mb-8 font-medium">Choose the region(s) you want to assess your program against.</p>

        <div className="space-y-12">
          <section>
            <h3 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.1em] mb-5">Assess a single region</h3>
            <div className="flex flex-wrap gap-4">
              <RegionCard flag="🇺🇸" name="FDA"    sub="U.S."      active={selectedRegion === "FDA"}  onClick={() => setSelectedRegion("FDA")} />
              <RegionCard flag="🇪🇺" name="EMA"    sub="EU"        active={selectedRegion === "EMA"}  onClick={() => setSelectedRegion("EMA")} />
              <RegionCard flag="🇬🇧" name="MHRA"   sub="UK" />
              <RegionCard flag="🇨🇦" name="Health" sub="Canada" />
              <RegionCard flag="🇯🇵" name="PMDA"   sub="Japan" />
              <RegionCard flag="🇨🇳" name="NMPA"   sub="China" />
              <RegionCard flag="🇦🇺" name="TGA"    sub="Australia" />
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <section>
              <h3 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.1em] mb-5">Assess multiple regions</h3>
              <div className="flex gap-4">
                <div className="flex-1 flex items-center gap-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl cursor-pointer hover:border-blue-400 group transition-all">
                  <div className="flex -space-x-2"><span className="text-xl">🇺🇸</span><span className="text-xl">🇪🇺</span></div>
                  <span className="text-[12px] font-bold text-[#475569] uppercase tracking-wider group-hover:text-blue-600">FDA + EMA</span>
                </div>
                <div className="flex-1 flex items-center gap-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl cursor-pointer hover:border-blue-400 group transition-all">
                  <div className="flex -space-x-2"><span className="text-xl">🇺🇸</span><span className="text-xl">🇪🇺</span><span className="text-xl">🇯🇵</span></div>
                  <span className="text-[12px] font-bold text-[#475569] uppercase tracking-wider group-hover:text-blue-600">FDA + EMA + PMDA</span>
                </div>
              </div>
            </section>
            <section className="flex flex-col justify-end">
              <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl cursor-pointer hover:border-blue-400 group transition-all">
                <Globe size={20} className="text-[#2563EB]" />
                <span className="text-[12px] font-bold text-[#475569] uppercase tracking-wider group-hover:text-blue-600">Global (All Regions)</span>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Selection summary */}
      <div className="lg:col-span-3 bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">Your selection</span>
          <button className="text-[#2563EB] text-[12px] font-bold flex items-center gap-1 hover:underline">
            <Edit3 size={14} /> Change
          </button>
        </div>
        <div className="flex items-center gap-4 mb-10">
          <div className="text-[44px] leading-none drop-shadow-sm">🇺🇸</div>
          <div>
            <p className="text-[18px] font-bold text-[#0F172A] leading-tight">FDA (U.S.)</p>
          </div>
        </div>
        <div className="space-y-6 flex-1">
          <SummaryItem label="Submission Type"  value="IND" />
          <SummaryItem label="Product Type"     value="Biologic" />
          <SummaryItem label="Development Stage" value="Preclinical" />
        </div>
        <button className="w-full py-4 bg-[#2563EB] text-white rounded-lg font-bold text-[14px] flex items-center justify-center gap-2 shadow-lg shadow-blue-100 mt-10 hover:bg-[#1D4ED8] transition-all">
          Start Assessment <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
