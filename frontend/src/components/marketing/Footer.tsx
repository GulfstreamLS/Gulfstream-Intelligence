import Link from "next/link";
import { Linkedin, Mail } from "lucide-react";
import { GsLogo } from "@/components/ui/GsLogo";

const FOOTER = {
  tagline: "The operating system for global regulatory strategy.",
  contact: {
    heading: "Contact Us",
    sub: "We'd love to hear from you.",
    email: "contact@gulfstreamintelligence.com",
  },
  socials: [
    { icon: Linkedin, label: "LinkedIn", href: "#" },
    { icon: Mail,     label: "Email",    href: "mailto:contact@gulfstreamintelligence.com" },
  ],
  copyright: "© 2025 Gulfstream Intelligence. All rights reserved.",
};

export function Footer() {
  return (
    <footer className="bg-white dark:bg-[#040E26] border-t border-gs-border dark:border-white/10">
      <div className="gs-container py-10">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8">

          {/* Brand */}
          <div className="space-y-3">
            <GsLogo iconSize={36} />
            <p className="text-[13px] text-gs-muted max-w-[220px] leading-relaxed">
              {FOOTER.tagline}
            </p>
          </div>

          {/* Contact + socials */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
            <div className="space-y-1">
              <p className="text-[13px] font-semibold text-gs-text dark:text-white">
                {FOOTER.contact.heading}
              </p>
              <p className="text-[12px] text-gs-muted">{FOOTER.contact.sub}</p>
              <Link
                href={`mailto:${FOOTER.contact.email}`}
                className="text-[12px] text-gs-blue hover:underline block"
              >
                {FOOTER.contact.email}
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {FOOTER.socials.map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-gs-bg dark:bg-white/10 flex items-center justify-center text-gs-muted hover:text-gs-blue dark:hover:text-gs-sky hover:bg-gs-border dark:hover:bg-white/20 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gs-border dark:border-white/10">
          <p className="text-[12px] text-gs-muted text-center">{FOOTER.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
