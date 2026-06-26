import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Target,
  Eye,
  Users,
  Mail,
  MapPin,
  Linkedin,
  Twitter,
  Github,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | DUALAIHUB",
  description:
    "Learn about DUALAIHUB's mission to empower creators with next-generation AI tools. Meet our team and discover our story.",
  keywords: ["about", "AI company", "AI tools", "team", "mission"],
};

const teamMembers = [
  {
    name: "Alex Chen",
    role: "Chief Executive Officer",
    bio: "Former AI research lead at major tech companies with 15+ years experience in machine learning.",
    image: "/api/placeholder/200/200",
  },
  {
    name: "Sarah Johnson",
    role: "Chief Technology Officer",
    bio: "Distributed systems expert and AI infrastructure architect with a passion for scalable solutions.",
    image: "/api/placeholder/200/200",
  },
  {
    name: "Michael Park",
    role: "Head of Product",
    bio: "Product strategy leader focused on creating intuitive AI experiences for creators worldwide.",
    image: "/api/placeholder/200/200",
  },
  {
    name: "Emily Rodriguez",
    role: "Head of Engineering",
    bio: "Full-stack engineer with deep expertise in building real-time AI applications and APIs.",
    image: "/api/placeholder/200/200",
  },
];

const values = [
  {
    icon: Target,
    title: "Precision",
    description:
      "We deliver accurate, high-quality AI outputs through our dual-model scheduling system.",
  },
  {
    icon: Eye,
    title: "Transparency",
    description:
      "Clear communication about how our AI works and how your data is processed.",
  },
  {
    icon: Users,
    title: "Accessibility",
    description:
      "Powerful AI tools should be available to everyone, regardless of technical background.",
  },
];

export default function AboutPage() {
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
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            About <span className="gradient-text">DUALAIHUB</span>
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto mb-8">
            We&apos;re on a mission to democratize artificial intelligence and empower
            creators worldwide with cutting-edge AI tools.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/contact">Get in Touch</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Our <span className="gradient-text">Mission</span>
              </h2>
              <p className="text-lg text-white/60 mb-6 leading-relaxed">
                At DUALAIHUB, we believe that artificial intelligence should be a
                powerful yet accessible tool for everyone. Our dual AI scheduling
                technology combines multiple AI models to deliver faster, more
                accurate results than any single AI system can achieve alone.
              </p>
              <p className="text-lg text-white/60 leading-relaxed">
                Founded by a team of AI researchers and engineers, we&apos;re building
                the next generation of creative tools that help individuals and
                businesses bring their ideas to life—whether it&apos;s generating
                text, code, images, music, or videos.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0066ff]/20 to-[#00d4ff]/20 rounded-3xl blur-xl" />
              <div className="relative bg-[#0f0f1a] border border-white/10 rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { value: "50M+", label: "Generations" },
                    { value: "100K+", label: "Active Users" },
                    { value: "99.9%", label: "Uptime" },
                    { value: "4.9/5", label: "User Rating" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-3xl font-bold gradient-text mb-1">
                        {stat.value}
                      </div>
                      <div className="text-sm text-white/50">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="px-4 py-20 border-t border-white/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Our Core <span className="gradient-text">Values</span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              These principles guide everything we do, from product development to
              customer support.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-8 hover:border-[#0066ff]/30 transition-colors"
              >
                <div className="w-14 h-14 rounded-xl bg-[#0066ff]/10 border border-[#0066ff]/20 flex items-center justify-center mb-6">
                  <value.icon className="w-7 h-7 text-[#00d4ff]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {value.title}
                </h3>
                <p className="text-white/60 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="px-4 py-20 border-t border-white/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Meet Our <span className="gradient-text">Team</span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              A diverse group of AI experts, engineers, and creative thinkers
              united by a passion for innovation.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 text-center hover:border-[#0066ff]/30 transition-colors"
              >
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff] p-1">
                  <div className="w-full h-full rounded-full bg-[#1a1a2e] flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {member.name}
                </h3>
                <p className="text-sm text-[#00d4ff] mb-3">{member.role}</p>
                <p className="text-sm text-white/50 leading-relaxed">
                  {member.bio}
                </p>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button className="p-2 rounded-lg bg-[#1a1a2e] border border-white/10 text-[#a0a0b0] hover:text-white hover:border-[#0066ff]/30 transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg bg-[#1a1a2e] border border-white/10 text-[#a0a0b0] hover:text-white hover:border-[#0066ff]/30 transition-colors">
                    <Twitter className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg bg-[#1a1a2e] border border-white/10 text-[#a0a0b0] hover:text-white hover:border-[#0066ff]/30 transition-colors">
                    <Github className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="px-4 py-20 border-t border-white/5">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-r from-[#0066ff]/10 to-[#00d4ff]/10 border border-white/10 rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Get in Touch
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto">
              Have questions or want to partner with us? We&apos;d love to hear from
              you.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
              <div className="flex items-center gap-3 text-white/70">
                <Mail className="w-5 h-5 text-[#00d4ff]" />
                <span>contact@dualaihub.com</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <MapPin className="w-5 h-5 text-[#00d4ff]" />
                <span>San Francisco, CA</span>
              </div>
            </div>
            <Button size="lg" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
