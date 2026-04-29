import Link from "next/link";
import { ArrowRight, Globe, ShieldCheck, Shield, ChartNoAxesCombined } from "lucide-react";
import { DashboardPreview } from "./DashboardPreview";

const HERO = {
  badge: "THE OPERATING SYSTEM FOR GLOBAL REGULATORY STRATEGY",
  headlinePre: "Know what regulators will say",
  headlineItalic: "before",
  headlinePost: "they say it.",
  description:
    "Gulfstream Intelligence is the AI platform that helps life sciences teams anticipate regulatory expectations, close gaps, and accelerate global approvals with confidence.",
  valueProps: [
    { icon: Shield, label: "Anticipate Risk", sub: "Before Submission" },
    { icon: Globe, label: "Align Globally", sub: "Across Authorities" },
    { icon: ChartNoAxesCombined, label: "Accelerate Approvals", sub: "With Confidence" },
  ],
  ctas: [
    { label: "Talk to an Expert", href: "#contact", variant: "primary" as const },
    { label: "Start Using Gulfstream", href: "/register", variant: "outline" as const },
  ],
  privacy: "Your data is never used to train AI models.",
};

export function HeroSection() {
  return (
    <section
      className="relative flex min-h-[640px] overflow-hidden border-b border-white/60 bg-[#EAF5FF] lg:min-h-[700px]"
      style={{
        backgroundImage: "url('/images/Gulfstream%20Banner%20Picture.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Light wash keeps the ocean visible while preserving text contrast. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.72) 34%, rgba(255,255,255,0.36) 64%, rgba(255,255,255,0.08) 100%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#2563EB]/20 to-transparent" />

      <div className="relative w-full pb-14 pt-32 sm:pt-36 lg:pb-8 lg:pt-[104px]">
        <div className="mx-auto w-[80%]">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.88fr_1.34fr] xl:gap-12">

            {/* Left: copy */}
            <div className="max-w-[680px] space-y-6 lg:pt-14 xl:pt-16">
              <span className="inline-flex rounded-full border border-[#2563EB] bg-white/55 px-4 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#2563EB] shadow-sm backdrop-blur">
                {HERO.badge}
              </span>

              <h6 className="max-w-[680px] text-[36px] font-medoum leading-[1.08] text-[#151f69] sm:text-[44px] xl:text-[48px]">
                Know what regulators
                <br />
                will say <em className="italic !text-[#0a39ad]">{HERO.headlineItalic}</em>{" "}
                {HERO.headlinePost}
              </h6>

              <p className="max-w-[570px] text-[14px] font-semibold leading-relaxed text-[#0F2A6B] lg:text-[15px]">
                {HERO.description}
              </p>

              {/* Value props */}
              <div className="grid max-w-[640px] grid-cols-1 gap-4 pt-1 sm:grid-cols-3 sm:gap-7">
                {HERO.valueProps.map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                      <Icon className="text-[#243C76]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-extrabold leading-tight text-[#071B4D]">{label}</p>
                      <p className="text-[11px] font-semibold text-[#4A638A]">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                <Link
                  href={HERO.ctas[0].href}
                  className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-[4px] bg-[#2563EB] px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(37,99,235,0.24)] transition-colors hover:bg-[#0F2A6B]"
                >
                  {HERO.ctas[0].label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={HERO.ctas[1].href}
                  className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-[4px] border border-[#071B4D] bg-white/65 px-7 py-3.5 text-sm font-bold text-[#2563EB] shadow-sm backdrop-blur transition-colors hover:bg-white"
                >
                  {HERO.ctas[1].label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="flex items-center gap-1.5 pt-1 text-xs font-medium text-[#4A638A]">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />
                {HERO.privacy}
              </p>
            </div>

            {/* Right: dashboard preview */}
            <div className="hidden min-w-0 lg:block lg:pt-0">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
