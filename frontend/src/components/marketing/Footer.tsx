import React from 'react';
import { Linkedin, Mail } from 'lucide-react';
import { GsLogo } from '../ui/GsLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-gs-card py-8 md:py-10 px-4 border-t border-gs-border">
      <div className="gs-container mx-auto flex flex-col md:flex-row items-start justify-between gap-8 md:gap-12">

        {/* Branding Column */}
        <GsLogo />

        {/* Tagline Column */}
        <div className="max-w-full md:max-w-[200px]">
          <p className="text-gs-muted text-[14px] leading-relaxed font-medium">
            The operating system for global regulatory strategy.
          </p>
        </div>

        {/* Contact Column */}
        <div className="flex-1">
          <h4 className="text-gs-text text-[14px] font-bold mb-1">Contact Us</h4>
          <p className="text-gs-muted text-[14px] font-medium mb-1">We&apos;d love to hear from you.</p>
          <a
            href="mailto:contact@gulfstreamintelligence.com"
            className="text-gs-muted text-[14px] font-medium hover:underline break-all"
          >
            contact@gulfstreamintelligence.com
          </a>
        </div>

        {/* Social Icons Column */}
        <div className="flex gap-3">
          <a
            href="#"
            className="w-10 h-10 bg-gs-blue text-white rounded-[6px] flex items-center justify-center hover:bg-gs-deep-blue transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin size={20} fill="currentColor" />
          </a>
          <a
            href="#"
            className="w-10 h-10 bg-gs-blue text-white rounded-[6px] flex items-center justify-center hover:bg-gs-deep-blue transition-colors"
            aria-label="Email"
          >
            <Mail size={20} />
          </a>
        </div>

      </div>

      {/* Bottom copyright */}
      <div className="gs-container mx-auto mt-8 pt-6 border-t border-gs-border">
        <p className="text-gs-muted text-[12px] font-medium text-center md:text-left">
          © {new Date().getFullYear()} Gulfstream Intelligence. All rights reserved.
        </p>
      </div>
    </footer>
  );
};