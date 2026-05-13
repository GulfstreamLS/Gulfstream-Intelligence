import { ShieldCheck, LockKeyhole, FolderLock, Lock, Cloud } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface TrustItem {
  icon: LucideIcon;
  text: string;
}

const SECTION_LABEL = "BUILT FOR CONFIDENTIALITY. ENGINEERED FOR TRUST.";

const TRUST_ITEMS: TrustItem[] = [
  { icon: ShieldCheck,  text: "Your data is never used to train AI models." },
  { icon: LockKeyhole,  text: "Private, isolated environments available." },
  { icon: FolderLock,   text: "Built for confidential submissions & dossiers." },
  { icon: ShieldCheck,  text: "Enterprise-grade security (SOC 2 Type II roadmap)." },
  { icon: Lock,         text: "AES-256 encryption in transit & at rest." },
  { icon: Cloud,        text: "Hosted on GCS with 99.9% uptime." },
];

export function TrustBar() {
  return (
    <section className="py-4 lg:py-6 bg-white dark:bg-[#0D1E3A] border-y border-gs-border dark:border-white/10">
      <div className="gs-container">
        <p className="text-center text-[14px] font-bold tracking-[0.15em] uppercase text-gs-blue mb-4">
          {SECTION_LABEL}
        </p>

        <div className="flex flex-col sm:flex-row border py-6 px-2 sm:divide-x divide-[#D1DCF0] dark:divide-white/10">
          {TRUST_ITEMS.map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-3 px-5 py-3 sm:py-0 first:pl-0 last:pr-0"
            >
              <item.icon className="w-8 h-8 shrink-0 text-gs-blue mt-0.5" strokeWidth={1.6} />
              <p className="text-[12px] text-[#300370] dark:text-white/70 leading-snug">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
