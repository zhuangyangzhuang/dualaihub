"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin, Youtube } from "lucide-react";

const footerNavigation = {
  Product: [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "API", href: "#api" },
    { name: "Changelog", href: "#changelog" },
  ],
  Company: [
    { name: "About", href: "#about" },
    { name: "Blog", href: "#blog" },
    { name: "Careers", href: "#careers" },
    { name: "Press", href: "#press" },
  ],
  Legal: [
    { name: "Privacy", href: "#privacy" },
    { name: "Terms", href: "#terms" },
    { name: "Cookie Policy", href: "#cookies" },
    { name: "Licenses", href: "#licenses" },
  ],
  Support: [
    { name: "Help Center", href: "#help" },
    { name: "Contact Us", href: "#contact" },
    { name: "Community", href: "#community" },
    { name: "Status", href: "#status" },
  ],
};

const socialLinks = [
  { name: "Twitter", href: "#twitter", icon: Twitter },
  { name: "GitHub", href: "#github", icon: Github },
  { name: "LinkedIn", href: "#linkedin", icon: Linkedin },
  { name: "YouTube", href: "#youtube", icon: Youtube },
];

const paymentMethods = [
  { name: "Stripe", color: "#635BFF" },
  { name: "PayPal", color: "#003087" },
  { name: "USDT", color: "#26A17B" },
];

export function Footer() {
  return (
    <footer className="bg-[#0a0a0f] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Logo & Tagline */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-[#0066ff] to-[#00d4ff] bg-clip-text text-transparent">
                DUALAIHUB
              </span>
            </Link>
            <p className="mt-4 text-sm text-[#a0a0b0] max-w-xs">
              Empowering creators with next-generation AI tools. Create, innovate, and transform ideas into reality.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="p-2 rounded-lg bg-[#1a1a2e] border border-white/5 text-[#a0a0b0] hover:text-white hover:border-[#0066ff]/30 transition-all duration-200"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Columns */}
          {Object.entries(footerNavigation).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-white mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#a0a0b0] hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment Methods & Copyright */}
        <div className="mt-12 pt-8 border-t border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Payment Methods */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#a0a0b0]">Accepted Payments:</span>
              <div className="flex items-center gap-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.name}
                    className="px-3 py-1.5 rounded-md bg-[#1a1a2e] border border-white/5 text-xs font-medium text-[#a0a0b0]"
                    style={{
                      borderColor: method.color + "40",
                    }}
                  >
                    {method.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Copyright */}
            <p className="text-xs text-[#a0a0b0]">
              &copy; {new Date().getFullYear()} DUALAIHUB. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
