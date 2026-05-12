import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";

export interface FeatureCardData {
  icon: React.ElementType;
  iconBg: string;
  title: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
}

interface FeatureCardProps {
  data: FeatureCardData;
}

export function FeatureCard({ data }: FeatureCardProps) {
  const Icon = data.icon;

  return (
    <div className="card flex flex-col p-6 gap-4 hover:shadow-card-hover transition-shadow">
      {/* Icon */}
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
          data.iconBg
        )}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>

      {/* Title + description */}
      <div>
        <h3 className="text-base font-semibold text-gs-text">{data.title}</h3>
        <p className="mt-1 text-sm text-gs-muted leading-relaxed">{data.description}</p>
      </div>

      {/* Feature list */}
      <ul className="flex flex-col gap-1.5 flex-1">
        {data.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gs-muted">
            <CheckCircle2 className="w-4 h-4 text-gs-blue shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={data.ctaHref}
        className="btn-secondary w-full justify-center mt-auto"
      >
        {data.ctaLabel}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
