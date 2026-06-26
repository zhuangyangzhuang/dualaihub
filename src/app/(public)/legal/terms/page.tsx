import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import {
  FileText,
  User,
  Bot,
  Copyright,
  Ban,
  ShieldAlert,
  Globe,
  Calendar,
  Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | DUALAIHUB",
  description:
    "Read DUALAIHUB's Terms of Service governing your use of our AI platform, including user obligations, AI-generated content policies, and intellectual property rights.",
  keywords: ["terms of service", "terms and conditions", "user agreement", "legal"],
};

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    icon: FileText,
    content: [
      {
        subtitle: "Agreement",
        text: "By accessing or using DUALAIHUB's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.",
      },
      {
        subtitle: "Changes to Terms",
        text: "We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through our platform. Continued use of our services after such modifications constitutes acceptance of the updated terms.",
      },
      {
        subtitle: "Age Requirements",
        text: "You must be at least 18 years old or the age of majority in your jurisdiction to use our services. By using our services, you represent that you meet this requirement.",
      },
    ],
  },
  {
    id: "user-accounts",
    title: "User Accounts",
    icon: User,
    content: [
      {
        subtitle: "Account Registration",
        text: "To access our services, you must create an account with accurate and complete information. You are responsible for maintaining the security of your account credentials.",
      },
      {
        subtitle: "Account Security",
        text: "You agree to immediately notify us of any unauthorized use of your account. We are not liable for any loss or damage arising from unauthorized use of your credentials.",
      },
      {
        subtitle: "Account Termination",
        text: "We reserve the right to suspend or terminate accounts that violate these terms or engage in prohibited activities. Users may also terminate their accounts at any time through account settings.",
      },
      {
        subtitle: "Free Accounts",
        text: "Free accounts are provided for personal, non-commercial use. Commercial use requires a paid subscription. We reserve the right to convert free accounts to paid accounts if used for commercial purposes.",
      },
    ],
  },
  {
    id: "ai-content",
    title: "AI Generated Content",
    icon: Bot,
    content: [
      {
        subtitle: "Ownership",
        text: "You retain ownership of the content you create using our platform, subject to these terms. You grant us a license to use your content as described in our Privacy Policy.",
      },
      {
        subtitle: "Content Guidelines",
        text: "You agree not to use our AI services to generate content that is illegal, harmful, offensive, or violates the rights of others. This includes, but is not limited to, content that promotes violence, discrimination, or illegal activities.",
      },
      {
        subtitle: "Content Moderation",
        text: "We employ content moderation systems to prevent misuse of our platform. Content flagged by our systems may be reviewed and removed if it violates these terms.",
      },
      {
        subtitle: "Output Limitations",
        text: "AI-generated content may contain inaccuracies or biases. Users are responsible for reviewing and verifying the accuracy of any AI-generated content before use, particularly for professional, medical, legal, or safety-critical applications.",
      },
      {
        subtitle: "Commercial Use",
        text: "Paid subscribers may use AI-generated content for commercial purposes. Free tier users may use content for personal, non-commercial purposes only. Enterprise users have expanded commercial rights as specified in their agreements.",
      },
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    icon: Copyright,
    content: [
      {
        subtitle: "Our IP",
        text: "DUALAIHUB retains all intellectual property rights in our platform, technology, and branding. You may not use our trademarks, logos, or proprietary information without our written permission.",
      },
      {
        subtitle: "Your Content",
        text: "You retain all intellectual property rights in the content you create. By uploading or submitting content to our platform, you grant us a worldwide, non-exclusive, royalty-free license to use, store, and process your content to provide our services.",
      },
      {
        subtitle: "Feedback",
        text: "If you provide suggestions, ideas, or feedback about our services, we may use them without obligation to you.",
      },
      {
        subtitle: "Copyright Compliance",
        text: "You agree not to use our platform to generate content that infringes on third-party copyrights or intellectual property rights. Users are responsible for ensuring their prompts and use of generated content comply with applicable laws.",
      },
    ],
  },
  {
    id: "prohibited-uses",
    title: "Prohibited Uses",
    icon: Ban,
    content: [
      {
        subtitle: "Illegal Activities",
        text: "You may not use our services for any illegal purposes or to further illegal activities.",
      },
      {
        subtitle: "Harmful Content",
        text: "You may not generate content that promotes harm to individuals or groups, including violence, self-harm, or exploitation.",
      },
      {
        subtitle: "Fraud and Deception",
        text: "You may not use our services to create fraudulent documents, impersonate others, or deceive users.",
      },
      {
        subtitle: "Security Violations",
        text: "You may not attempt to gain unauthorized access to our systems, probe for vulnerabilities, or interfere with the integrity of our platform.",
      },
      {
        subtitle: "Automated Use",
        text: "You may not use automated systems, bots, or scripts to access our services without our written permission, except as permitted through our official API.",
      },
      {
        subtitle: "Reselling",
        text: "You may not resell, redistribute, or sublicense access to our platform without our written permission.",
      },
    ],
  },
  {
    id: "limitation-liability",
    title: "Limitation of Liability",
    icon: ShieldAlert,
    content: [
      {
        subtitle: "As-Is Service",
        text: "Our services are provided \"as is\" and \"as available\" without warranties of any kind. We do not guarantee that our services will be uninterrupted, secure, or error-free.",
      },
      {
        subtitle: "Liability Cap",
        text: "To the maximum extent permitted by law, DUALAIHUB shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities.",
      },
      {
        subtitle: "Direct Damages",
        text: "Our total liability for any claims arising from these terms or your use of our services shall not exceed the amount you paid us in the twelve months preceding the claim.",
      },
      {
        subtitle: "AI Accuracy",
        text: "AI-generated content may not always be accurate, complete, or suitable for your specific purpose. You use AI-generated content at your own risk and are responsible for verifying its accuracy.",
      },
    ],
  },
  {
    id: "governing-law",
    title: "Governing Law",
    icon: Globe,
    content: [
      {
        subtitle: "Jurisdiction",
        text: "These terms are governed by the laws of the State of California, without regard to conflict of law principles.",
      },
      {
        subtitle: "Dispute Resolution",
        text: "Any disputes arising from these terms or your use of our services shall be resolved through binding arbitration in San Francisco, California, in accordance with the rules of the American Arbitration Association.",
      },
      {
        subtitle: "Class Waiver",
        text: "You agree to resolve disputes individually and waive any right to participate in class actions or class arbitrations.",
      },
      {
        subtitle: "Injunctive Relief",
        text: "Notwithstanding the above, we may seek injunctive or other equitable relief in any court of competent jurisdiction to protect our intellectual property rights.",
      },
    ],
  },
  {
    id: "changes-terms",
    title: "Changes to Terms",
    icon: Calendar,
    content: [
      {
        subtitle: "Right to Modify",
        text: "We reserve the right to modify these terms at any time. Material changes will be communicated via email or notices on our platform.",
      },
      {
        subtitle: "Continued Use",
        text: "Your continued use of our services after the posting of modified terms constitutes acceptance of the modified agreement.",
      },
      {
        subtitle: "Notification",
        text: "For significant changes, we will provide at least 30 days' notice before the new terms take effect. Your only remedy if you disagree with changes is to stop using our services.",
      },
    ],
  },
  {
    id: "contact",
    title: "Contact Us",
    icon: Mail,
    content: [
      {
        subtitle: "Questions",
        text: "If you have any questions about these Terms of Service, please contact us at legal@dualaihub.com.",
      },
      {
        subtitle: "Correspondence",
        text: "For legal matters, please contact our legal department at legal@dualaihub.com or by mail at DUALAIHUB Legal, 123 AI Boulevard, Suite 500, San Francisco, CA 94102.",
      },
    ],
  },
];

export default function TermsOfServicePage() {
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
            Terms of <span className="gradient-text">Service</span>
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto mb-4">
            Please read these terms carefully before using DUALAIHUB. They govern
            your use of our AI platform and services.
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
