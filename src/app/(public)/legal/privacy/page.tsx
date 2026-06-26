import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { Shield, Lock, Eye, Cookie, Users, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | DUALAIHUB",
  description:
    "DUALAIHUB's Privacy Policy explains how we collect, use, and protect your personal information when you use our AI platform.",
  keywords: ["privacy policy", "data protection", "personal information", "GDPR"],
};

const sections = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
    icon: Eye,
    content: [
      {
        subtitle: "Personal Information",
        text: "When you register for an account, we collect information such as your name, email address, and payment information. This information is used to create and manage your account and provide you with our services.",
      },
      {
        subtitle: "Usage Data",
        text: "We automatically collect information about how you interact with our platform, including the features you use, the content you generate, and the time and duration of your sessions. This helps us improve our services and personalize your experience.",
      },
      {
        subtitle: "AI-Generated Content",
        text: "We may store the AI-generated content you create using our platform to provide service functionality, improve our algorithms, and comply with legal obligations.",
      },
      {
        subtitle: "Device Information",
        text: "We collect information about the device you use to access our services, including hardware specifications, operating system, and browser type.",
      },
    ],
  },
  {
    id: "how-we-use",
    title: "How We Use Your Information",
    icon: Shield,
    content: [
      {
        subtitle: "Service Delivery",
        text: "We use your information to provide, maintain, and improve our AI services. This includes processing your requests, generating content, and ensuring the quality of our outputs.",
      },
      {
        subtitle: "Account Management",
        text: "Your information is used to manage your account, process payments, and communicate with you about your subscription and service updates.",
      },
      {
        subtitle: "Service Improvement",
        text: "We analyze usage patterns to understand how users interact with our platform, identify bugs, and develop new features that enhance user experience.",
      },
      {
        subtitle: "Communications",
        text: "We may send you service-related notifications, marketing communications (with your consent), and updates about our platform. You can opt out of marketing communications at any time.",
      },
      {
        subtitle: "Legal Compliance",
        text: "We may process your information to comply with applicable laws, regulations, and legal processes.",
      },
    ],
  },
  {
    id: "information-sharing",
    title: "Information Sharing",
    icon: Users,
    content: [
      {
        subtitle: "Third-Party Service Providers",
        text: "We share your information with trusted third-party providers who assist us in delivering our services, including payment processors, cloud hosting providers, and analytics services.",
      },
      {
        subtitle: "AI Model Providers",
        text: "To provide our dual AI scheduling services, we may share your prompts and content with AI model providers such as OpenAI, Anthropic, and other partners. These providers are contractually obligated to protect your data.",
      },
      {
        subtitle: "Business Transfers",
        text: "In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction. We will notify you of any such change in our privacy practices.",
      },
      {
        subtitle: "Legal Requirements",
        text: "We may disclose your information if required to do so by law, court order, or governmental regulation, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.",
      },
      {
        subtitle: "With Your Consent",
        text: "We will not share your personal information with third parties for marketing purposes without your explicit consent.",
      },
    ],
  },
  {
    id: "data-security",
    title: "Data Security",
    icon: Lock,
    content: [
      {
        subtitle: "Encryption",
        text: "We use industry-standard encryption to protect your data during transmission and at rest. All sensitive information is encrypted using AES-256 encryption.",
      },
      {
        subtitle: "Access Controls",
        text: "We implement strict access controls and authentication measures to ensure that only authorized personnel can access your data. Access is granted on a least-privilege basis.",
      },
      {
        subtitle: "Regular Audits",
        text: "Our security practices are regularly audited by independent third parties to ensure compliance with industry standards.",
      },
      {
        subtitle: "Data Retention",
        text: "We retain your information for as long as your account is active or as needed to provide services. You may request deletion of your data at any time.",
      },
    ],
  },
  {
    id: "your-rights",
    title: "Your Rights",
    icon: Users,
    content: [
      {
        subtitle: "Access",
        text: "You have the right to request a copy of the personal information we hold about you.",
      },
      {
        subtitle: "Rectification",
        text: "You can update or correct your personal information at any time through your account settings.",
      },
      {
        subtitle: "Deletion",
        text: "You can request the deletion of your account and personal data. We will process your request within 30 days, subject to legal retention requirements.",
      },
      {
        subtitle: "Portability",
        text: "You have the right to receive your data in a structured, commonly used format. Contact us to request a data export.",
      },
      {
        subtitle: "Objection",
        text: "You may object to certain processing of your personal information, such as direct marketing. Contact us to exercise this right.",
      },
      {
        subtitle: "GDPR Rights",
        text: "If you are located in the European Economic Area, you have additional rights under the General Data Protection Regulation, including the right to lodge a complaint with a data protection authority.",
      },
    ],
  },
  {
    id: "cookies",
    title: "Cookies",
    icon: Cookie,
    content: [
      {
        subtitle: "What Are Cookies",
        text: "Cookies are small text files stored on your device that help us provide and improve our services. We use cookies and similar technologies for authentication, security, and analytics.",
      },
      {
        subtitle: "Types of Cookies We Use",
        text: "We use essential cookies necessary for our platform to function, analytics cookies to understand how users interact with our platform, and preference cookies to remember your settings.",
      },
      {
        subtitle: "Managing Cookies",
        text: "You can control cookie preferences through your browser settings. Disabling certain cookies may affect the functionality of our platform.",
      },
      {
        subtitle: "Third-Party Cookies",
        text: "Some cookies on our platform are placed by third-party services. We encourage you to review the privacy policies of these third parties.",
      },
    ],
  },
  {
    id: "contact-us",
    title: "Contact Us",
    icon: Mail,
    content: [
      {
        subtitle: "Questions",
        text: "If you have any questions about this Privacy Policy or our data practices, please contact our Data Protection Officer at privacy@dualaihub.com.",
      },
      {
        subtitle: "Requests",
        text: "To exercise your data rights or submit a privacy-related request, contact us at privacy@dualaihub.com. We will respond within 30 days.",
      },
      {
        subtitle: "Complaints",
        text: "If you are not satisfied with our response, you have the right to lodge a complaint with your local data protection authority.",
      },
    ],
  },
];

export default function PrivacyPolicyPage() {
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
            Privacy <span className="gradient-text">Policy</span>
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto mb-4">
            Your privacy is important to us. This policy explains how we
            collect, use, and protect your personal information.
          </p>
          <p className="text-sm text-white/40">Last updated: June 25, 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 pb-20">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl overflow-hidden">
            {/* Table of Contents */}
            <div className="p-6 md:p-8 border-b border-white/5">
              <h2 className="text-lg font-semibold text-white mb-4">
                Table of Contents
              </h2>
              <nav className="grid md:grid-cols-2 gap-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="text-sm text-white/60 hover:text-[#00d4ff] transition-colors py-1"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>

            {/* Sections */}
            <div className="p-6 md:p-8 space-y-12">
              {sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-[#0066ff]/10 border border-[#0066ff]/20 flex items-center justify-center">
                      <section.icon className="w-5 h-5 text-[#00d4ff]" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      {section.title}
                    </h2>
                  </div>
                  <div className="space-y-6 pl-0 md:pl-13">
                    {section.content.map((item, index) => (
                      <div key={index}>
                        <h3 className="text-lg font-medium text-white mb-2">
                          {item.subtitle}
                        </h3>
                        <p className="text-white/60 leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          {/* Related Links */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/legal/terms"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <span className="text-white/20">|</span>
            <Link
              href="/legal/cookies"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Cookie Policy
            </Link>
            <span className="text-white/20">|</span>
            <Link
              href="/contact"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
