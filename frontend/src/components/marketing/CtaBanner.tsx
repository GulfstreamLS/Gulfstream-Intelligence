import React from 'react';
import { MessageCircle, Shield } from 'lucide-react';
import { WaveIcon } from '../ui/GsLogo';

export const CTABanner: React.FC = () => {
  return (
    <div className="gs-container">
      <div className="mx-auto bg-[#001440] rounded-[14px] p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 text-center md:text-left">
        {/* Left Section: Icon & Text */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
          <div className="shrink-0">
            <div className="relative w-16 h-16 sm:w-[96px] sm:h-[96px]">
              <Shield size={64} strokeWidth={0.8} className="text-white w-full h-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <WaveIcon size={22} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-white text-[22px] sm:text-[24px] md:text-[28px] font-bold tracking-tight">
              Know what regulators will say before they say it.
            </h2>
            <p className="text-white/80 text-[15px] md:text-[18px] leading-relaxed max-w-2xl">
              Join life sciences leaders using Gulfstream Intelligence
              to make smarter regulatory decisions—faster.
            </p>
          </div>
        </div>

        {/* Right Section: Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center w-full md:w-auto shrink-0">
          <button className="flex items-center justify-center gap-2 bg-white text-[#001440] px-6 sm:px-8 py-3.5 rounded-lg font-bold text-[15px] hover:bg-slate-100 transition-colors shadow-sm whitespace-nowrap">
            <MessageCircle size={18} strokeWidth={2.5} />
            Talk to an Expert
          </button>
          <button className="bg-[#0052FF] text-white px-6 sm:px-8 py-3.5 rounded-lg font-bold text-[15px] hover:bg-[#0041CC] transition-all shadow-lg shadow-blue-900/20 whitespace-nowrap">
            Start Using Gulfstream
          </button>
        </div>
      </div>
    </div>
  );
};