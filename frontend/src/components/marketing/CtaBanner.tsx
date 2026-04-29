import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { GsLogo } from "@/components/ui/GsLogo";

const BANNER = {
  heading: "Know what regulators will say before they say it.",
  description:
    "Join life sciences leaders using Gulfstream Intelligence to make smarter regulatory decisions—faster.",
  ctas: [
    { label: "Talk to an Expert", href: "#contact", icon: MessageCircle, variant: "outline" as const },
    { label: "Start Using Gulfstream", href: "/register", variant: "primary" as const },
  ],
};

export function CtaBanner() {
  return (
    <section
      className="relative py-16 lg:py-20 overflow-hidden"
      style={{
        backgroundImage: "url('/images/gs-banner.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay so text stays readable over banner image */}
      <div className="absolute inset-0 bg-gs-navy/85" />

      <div className="relative gs-container">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">

          {/* Left */}
          <div className="text-center lg:text-left space-y-4 max-w-xl">
            <GsLogo variant="light" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {BANNER.heading}
            </h2>
            <p className="text-[15px] text-white/60 leading-relaxed">
              {BANNER.description}
            </p>
          </div>

          {/* Right — CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              href={BANNER.ctas[0].href}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-[10px] border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors min-h-[48px]"
            >
              <MessageCircle className="w-4 h-4" />
              {BANNER.ctas[0].label}
            </Link>
            <Link
              href={BANNER.ctas[1].href}
              className="btn-primary px-6 py-3.5 min-h-[48px] shadow-blue-glow"
            >
              {BANNER.ctas[1].label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
