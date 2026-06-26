import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { Cookie, Settings, Shield, RefreshCw, Bell } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie Policy | DUALAIHUB",
  description:
    "Learn about how DUALAIHUB uses cookies and similar technologies to enhance your experience on our AI platform.",
  keywords: ["cookie policy", "cookies", "tracking", "data privacy"],
};

const sections = [
  {
    id: "what-are-cookies",
    title: "What Are Cookies",
    icon: Cookie,
    content: [
      {
        subtitle: "Definition",
        text: "Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit a website. They help websites remember your preferences and understand how you interact with the site.",
      },
      {
        subtitle: "How We Use Them",
        text: "At DUALAIHUB, we use cookies and similar tracking technologies to enhance your experience, secure our platform, and analyze how you use our services. These technologies collect information about your browsing behavior.",
      },
      {
        subtitle: "Similar Technologies",
        text: "Beyond cookies, we may also use local storage, session storage, pixels, and other tracking technologies for similar purposes.",
      },
    ],
  },
  {
    id: "how-we-use",
    title: "How We Use Cookies",
    icon: Settings,
    content: [
      {
        subtitle: "Authentication",
        text: "We use cookies to recognize you when you sign in to your account. This allows us to personalize your experience and maintain your session security.",
      },
      {
        subtitle: "Preferences",
        text: "Cookies help us remember your preferences and settings, such as your language preference, theme choices, and display preferences. This ensures a consistent experience across visits.",
      },
      {
        subtitle: "Analytics",
        text: "We use analytics cookies to understand how visitors interact with our platform. This helps us identify areas for improvement and optimize the user experience.",
      },
      {
        subtitle: "Security",
        text: "Security cookies help us detect suspicious activity, prevent fraud, and protect your account from unauthorized access.",
      },
      {
        subtitle: "Performance",
        text: "Performance cookies help us understand how our platform performs and identify technical issues. They also help us optimize loading times and responsiveness.",
      },
    ],
  },
  {
    id: "types-of-cookies",
    title: "Types of Cookies We Use",
    icon: Shield,
    content: [
      {
        subtitle: "Essential Cookies",
        text: "These cookies are necessary for our platform to function properly. They enable core features like user authentication, security, and basic site operations. Without these, certain services cannot be provided.",
      },
      {
        subtitle: "Functional Cookies",
        text: "These cookies enable enhanced features and personalization, such as remembering your preferences, language settings, and providing customized content. You can opt out of these cookies, but some features may not work properly.",
      },
      {
        subtitle: "Analytics Cookies",
        text: "These cookies help us understand how visitors interact with our platform by collecting anonymous information about pages visited, time spent, and error messages encountered. We use this data to improve our services.",
      },
      {
        subtitle: "Marketing Cookies",
        text: "We may use marketing cookies to track browsing behavior across websites and deliver relevant advertisements. These cookies are only used with your consent. You can opt out at any time through your browser settings or our cookie preferences.",
      },
      {
        subtitle: "Third-Party Cookies",
        text: "Some cookies are set by third-party services we use, such as payment providers (Stripe, PayPal), analytics providers, and social media platforms. These third parties have their own privacy policies.",
      },
    ],
  },
  {
    id: "managing-cookies",
    title: "Managing Cookies",
    icon: Settings,
    content: [
      {
        subtitle: "Browser Settings",
        text: "Most web browsers allow you to manage cookies through their settings. You can typically block cookies, delete existing cookies, or allow cookies only from specific websites only.",
      },
      {
        subtitle: "How to Block",
        text: "To manage cookies in your browser, go to your browser's settings or preferences. Look for 'Privacy,' 'Security,' or 'Cookies' sections. From there, you can adjust your cookie preferences.",
      },
      {
        subtitle: "Impact of Disabling",
        text: "Disabling essential cookies may affect the functionality of our platform. You may experience reduced features, login issues, or degraded performance. We recommend keeping essential cookies enabled for the best experience.",
      },
      {
        subtitle: "Our Cookie Banner",
        text: "When you first visit our platform, you will see a cookie consent banner. You can accept all cookies, reject non-essential cookies, or customize your preferences. Your preferences will be saved for future visits.",
      },
      {
        subtitle: "Updating Preferences",
        text: "You can update your cookie preferences at any time by clicking the 'Cookie Settings' link in our footer or contacting us. Note that changes may take effect immediately or after clearing your browser cache.",
      },
    ],
  },
  {
    id: "third-party-cookies",
    title: "Third-Party Cookies",
    icon: RefreshCw,
    content: [
      {
        subtitle: "Payment Providers",
        text: "When you make a payment, cookies from Stripe or PayPal may be set to process your transaction securely. These providers have their own privacy and cookie policies.",
      },
      {
        subtitle: "Analytics Services",
        text: "We use analytics services that set cookies to collect information about your use of our platform. These services help us understand visitor behavior and improve our services.",
      },
      {
        subtitle: "Social Media",
        text: "If you share content from our platform on social media, cookies from platforms like Twitter, LinkedIn, or Facebook may be set. Review their privacy policies for more information.",
      },
      {
        subtitle: "Advertising Partners",
        text: "Our advertising partners may use cookies to deliver relevant advertisements based on your interests. These cookies track your browsing behavior across different websites.",
      },
      {
        subtitle: "Third-Party Links",
        text: "Our platform may contain links to third-party websites. We are not responsible for the cookie practices of these external sites. We encourage you to review their privacy and cookie policies.",
      },
    ],
  },
  {
    id: "updates",
    title: "Updates to This Policy",
    icon: Bell,
    content: [
      {
        subtitle: "Policy Changes",
        text: "We may update this Cookie Policy from time to time to reflect changes in our practices, technologies, or legal requirements. Any updates will be posted on this page.",
      },
      {
        subtitle: "Notification",
        text: "For significant changes, we will notify you through our platform, email, or by updating the 'Last updated' date at the top of this policy.",
      },
      {
        subtitle: "Review Policy",
        text: "We encourage you to review this Cookie Policy periodically to stay informed about our use of cookies and tracking technologies.",
      },
      {
        subtitle: "Contact",
        text: "If you have questions about this Cookie Policy or our use of cookies, please contact us at privacy@dualaihub.com.",
      },
    ],
  },
];

export default function CookiePolicyPage() {
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
            Cookie <span className="gradient-text">Policy</span>
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto mb-4">
            Learn about how DUALAIHUB uses cookies and similar technologies to
            enhance your experience on our platform.
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
              href="/legal/privacy"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-white/20">|</span>
            <Link
              href="/legal/terms"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Terms of Service
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
