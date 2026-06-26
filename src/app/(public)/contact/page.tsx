"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ContactForm } from "@/components/contact/ContactForm";
import Link from "next/link";
import { Mail, MapPin, Clock, MessageSquare, Phone } from "lucide-react";

export default function ContactPage() {
  const t = useTranslations('contact');
  const tNav = useTranslations('nav');
  const tFooter = useTranslations('footer');

  return (
    <div className="min-h-screen w-full overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0066ff]/5 to-[#0a0a0f]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0066ff]/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00d4ff]/10 rounded-full blur-[128px]" />
      </div>

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            {t('title')}
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="px-4 pb-20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                {t('form.submit')}
              </h2>
              <ContactForm />
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* Info Cards */}
              <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">
                  {t('info.title')}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#0066ff]/10 border border-[#0066ff]/20 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-[#00d4ff]" />
                    </div>
                    <div>
                      <p className="text-sm text-white/50 mb-1">{t('info.email')}</p>
                      <a
                        href="mailto:contact@dualaihub.com"
                        className="text-white hover:text-[#00d4ff] transition-colors"
                      >
                        contact@dualaihub.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#0066ff]/10 border border-[#0066ff]/20 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-[#00d4ff]" />
                    </div>
                    <div>
                      <p className="text-sm text-white/50 mb-1">Phone</p>
                      <a
                        href="tel:+14155551234"
                        className="text-white hover:text-[#00d4ff] transition-colors"
                      >
                        +1 (415) 555-1234
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#0066ff]/10 border border-[#0066ff]/20 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-[#00d4ff]" />
                    </div>
                    <div>
                      <p className="text-sm text-white/50 mb-1">Location</p>
                      <p className="text-white">
                        123 AI Boulevard, Suite 500
                        <br />
                        San Francisco, CA 94102
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Response Time */}
              <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#0066ff]/10 border border-[#0066ff]/20 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-[#00d4ff]" />
                  </div>
                  <div>
                    <p className="text-sm text-white/50 mb-1">
                      Response Time
                    </p>
                    <p className="text-white mb-2">
                      {t('info.response')}
                    </p>
                    <p className="text-sm text-white/50">
                      For urgent matters, please include &quot;URGENT&quot; in your
                      subject line.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Quick Links
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/pricing"
                    className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-[#00d4ff]" />
                    <span>{tNav('pricing')}</span>
                  </Link>
                  <Link
                    href="/legal/privacy"
                    className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-[#00d4ff]" />
                    <span>{tFooter('privacy')}</span>
                  </Link>
                  <Link
                    href="/legal/terms"
                    className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-[#00d4ff]" />
                    <span>{tFooter('terms')}</span>
                  </Link>
                  <Link
                    href="/legal/cookies"
                    className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-[#00d4ff]" />
                    <span>{tFooter('cookies')}</span>
                  </Link>
                </div>
              </div>

              {/* Support Channels */}
              <div className="bg-gradient-to-r from-[#0066ff]/10 to-[#00d4ff]/10 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Other Support Channels
                </h3>
                <div className="space-y-3">
                  <p className="text-sm text-white/60">
                    For technical issues, visit our{" "}
                    <Link
                      href="#help"
                      className="text-[#00d4ff] hover:underline"
                    >
                      Help Center
                    </Link>
                  </p>
                  <p className="text-sm text-white/60">
                    For billing questions, email{" "}
                    <a
                      href="mailto:billing@dualaihub.com"
                      className="text-[#00d4ff] hover:underline"
                    >
                      billing@dualaihub.com
                    </a>
                  </p>
                  <p className="text-sm text-white/60">
                    For partnerships, email{" "}
                    <a
                      href="mailto:partners@dualaihub.com"
                      className="text-[#00d4ff] hover:underline"
                    >
                      partners@dualaihub.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}