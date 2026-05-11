"use client";

import { useState } from "react";
import { Mail, Building2, MessageSquare, Send, CheckCircle } from "lucide-react";
import { subscriptionApi } from "../../lib/api";

export function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await subscriptionApi.contactSales({ name: name.trim(), email: email.trim(), company: company.trim() || undefined, message: message.trim() });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="contact-us" className="gs-container py-16 md:py-24 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left — copy */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-gs-blue mb-3">Enterprise &amp; Sales</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gs-text leading-tight">
                Ready for enterprise-grade regulatory intelligence?
              </h2>
            </div>
            <p className="text-[17px] text-gs-muted leading-relaxed">
              Get a personalized demo, custom pricing, and dedicated support for your organization.
              Our team typically responds within one business day.
            </p>

            <div className="space-y-4 pt-2">
              {[
                { icon: <Building2 className="w-5 h-5" />, title: "Custom integrations", desc: "Connect with your existing regulatory systems and workflows." },
                { icon: <Mail className="w-5 h-5" />, title: "Dedicated support", desc: "A named account manager and priority SLA." },
                { icon: <MessageSquare className="w-5 h-5" />, title: "Compliance-ready", desc: "Data handling agreements, audit trails, and SSO on request." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gs-blue/10 flex items-center justify-center text-gs-blue shrink-0">
                    {icon}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-gs-text">{title}</p>
                    <p className="text-[13px] text-gs-muted mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-gs-card border border-gs-border rounded-2xl p-8 shadow-card">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <CheckCircle className="w-14 h-14 text-gs-green" />
                <h3 className="text-xl font-bold text-gs-text">Message sent!</h3>
                <p className="text-sm text-gs-muted max-w-xs">
                    We&apos;ll be in touch within one business day. Check your inbox at <strong className="text-gs-text">{email}</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-gs-text mb-6">Contact Sales</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full px-3 py-2.5 border border-gs-border rounded-lg bg-gs-bg text-gs-text text-sm focus:outline-none focus:ring-2 focus:ring-gs-blue placeholder:text-gs-muted"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">Work Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@company.com"
                      className="w-full px-3 py-2.5 border border-gs-border rounded-lg bg-gs-bg text-gs-text text-sm focus:outline-none focus:ring-2 focus:ring-gs-blue placeholder:text-gs-muted"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">Company</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Pharma Inc."
                    className="w-full px-3 py-2.5 border border-gs-border rounded-lg bg-gs-bg text-gs-text text-sm focus:outline-none focus:ring-2 focus:ring-gs-blue placeholder:text-gs-muted"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">Message *</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your team size, use case, and any specific requirements…"
                    className="w-full px-3 py-2.5 border border-gs-border rounded-lg bg-gs-bg text-gs-text text-sm focus:outline-none focus:ring-2 focus:ring-gs-blue placeholder:text-gs-muted resize-none"
                  />
                </div>

                {error && <p className="text-sm text-gs-red">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gs-blue hover:bg-gs-deep-blue text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-60 min-h-[44px]"
                >
                  {loading ? "Sending…" : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>

                <p className="text-[11px] text-gs-muted text-center">
                  By submitting, you agree to our privacy policy. No spam, ever.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
