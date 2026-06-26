"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Code2,
  ImageIcon,
  Video,
  Zap,
  ChevronRight,
  Sparkles,
  Bot,
  Layers,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const floatingIcons = [
  { Icon: Brain, delay: 0, x: "10%", y: "20%" },
  { Icon: Code2, delay: 0.5, x: "85%", y: "15%" },
  { Icon: ImageIcon, delay: 1, x: "15%", y: "70%" },
  { Icon: Video, delay: 1.5, x: "80%", y: "75%" },
  { Icon: Sparkles, delay: 0.8, x: "50%", y: "10%" },
  { Icon: Bot, delay: 1.2, x: "70%", y: "50%" },
];

const features = [
  {
    Icon: Brain,
    title: "Text AI",
    description:
      "Advanced natural language processing for writing, summarization, and content generation with context-aware intelligence.",
    gradient: "from-[#0066ff] to-[#00d4ff]",
  },
  {
    Icon: Code2,
    title: "Code AI",
    description:
      "Intelligent code completion, debugging, and generation across 50+ programming languages with context understanding.",
    gradient: "from-[#00d4ff] to-[#00ff88]",
  },
  {
    Icon: ImageIcon,
    title: "Image AI",
    description:
      "Create stunning visuals, edit photos, and generate artwork from text descriptions with state-of-the-art models.",
    gradient: "from-[#ff6b00] to-[#ff0066]",
  },
  {
    Icon: Video,
    title: "Video AI",
    description:
      "Generate and edit videos with AI, add effects, create animations, and produce professional-quality content.",
    gradient: "from-[#8800ff] to-[#00d4ff]",
  },
];

const steps = [
  {
    number: "01",
    title: "Choose AI Type",
    description: "Select from Text, Code, Image, or Video AI based on your needs",
    icon: Layers,
  },
  {
    number: "02",
    title: "Enter Prompt",
    description: "Describe what you want to create using natural language",
    icon: Sparkles,
  },
  {
    number: "03",
    title: "Get Results",
    description: "Receive high-quality output powered by dual AI scheduling",
    icon: Zap,
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Engineer at TechCorp",
    content:
      "DUALAIHUB has revolutionized our development workflow. The code AI understands context better than any other tool I've used.",
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Content Creator",
    content:
      "The dual AI scheduling delivers incredibly fast results. I can generate images and videos in minutes instead of hours.",
    avatar: "MJ",
  },
  {
    name: "Elena Rodriguez",
    role: "Marketing Director",
    content:
      "Game changer for our marketing team. We create more content in a week than we used to in a month.",
    avatar: "ER",
  },
];

const pricingPlans = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: 50,
    features: [
      "50 credits/month",
      "Basic Text AI",
      "720p Video Generation",
      "Community Support",
    ],
    isPopular: false,
    ctaText: "Get Started",
  },
  {
    name: "Starter",
    monthlyPrice: 19,
    yearlyPrice: 15,
    credits: 500,
    features: [
      "500 credits/month",
      "All Text & Code AI",
      "1080p Video Generation",
      "Priority Support",
    ],
    isPopular: false,
    ctaText: "Start Free Trial",
  },
  {
    name: "Pro",
    monthlyPrice: 49,
    yearlyPrice: 39,
    credits: 2000,
    features: [
      "2000 credits/month",
      "All AI Models",
      "4K Video Generation",
      "API Access",
      "Dedicated Support",
    ],
    isPopular: true,
    ctaText: "Start Free Trial",
  },
  {
    name: "Enterprise",
    monthlyPrice: 199,
    yearlyPrice: 159,
    credits: "Unlimited",
    features: [
      "Unlimited credits",
      "Custom AI Models",
      "8K Video Generation",
      "White-label Options",
      "SLA Guarantee",
    ],
    isPopular: false,
    ctaText: "Contact Sales",
  },
];

export default function HomePage() {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          {/* Gradient Mesh */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0066ff]/10 via-transparent to-[#00d4ff]/10" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0066ff]/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00d4ff]/15 rounded-full blur-[128px]" />

          {/* Floating Animated Icons */}
          {floatingIcons.map(({ Icon, delay, x, y }, index) => (
            <motion.div
              key={index}
              className="absolute text-[#0066ff]/20"
              style={{ left: x, top: y }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0.1, 0.3, 0.1],
                scale: [1, 1.1, 1],
                y: [0, -15, 0],
              }}
              transition={{
                duration: 6,
                delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Icon className="w-16 h-16 md:w-24 md:h-24" />
            </motion.div>
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#0066ff]/30 bg-[#0066ff]/10 mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4 text-[#00d4ff]" />
              <span className="text-sm text-white/80">
                Powered by Dual AI Scheduling
              </span>
            </motion.div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
              <span className="gradient-text">Welcome to</span>
              <br />
              <span className="text-white">DUALAIHUB</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto mb-12 leading-relaxed">
              Experience the future of artificial intelligence with our
              revolutionary dual AI scheduling technology. Seamlessly create
              text, code, images, and videos with unparalleled speed and
              quality.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#0066ff] to-[#00d4ff] text-white shadow-lg shadow-[#0066ff]/30 hover:shadow-[#0066ff]/50"
                asChild
              >
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#0066ff]/30 text-[#00d4ff] hover:bg-[#0066ff]/10"
                asChild
              >
                <Link href="/pricing">
                  View Pricing
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
              <div className="w-1.5 h-3 bg-white/50 rounded-full" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0066ff]/5 to-transparent" />

        <div className="relative z-10 container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              All-in-One{" "}
              <span className="gradient-text">AI Platform</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Four powerful AI engines working in harmony to bring your ideas
              to life
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ Icon, title, description, gradient }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative p-6 rounded-2xl border border-[#2a2a3e] bg-[#0f0f1a]/50 backdrop-blur-sm hover:border-[#0066ff]/30 transition-all duration-300"
              >
                {/* Glow effect */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-xl`}
                />

                <div
                  className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-xl font-semibold text-white mb-2">
                  {title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {description}
                </p>

                {/* Hover border glow */}
                <div
                  className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border border-transparent bg-gradient-to-br ${gradient} -z-10 blur-sm`}
                  style={{ margin: "-1px" }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Get started in minutes with our intuitive workflow
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0066ff]/50 via-[#00d4ff]/50 to-[#0066ff]/50 hidden lg:block" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {steps.map(({ number, title, description, icon: Icon }, index) => (
                <motion.div
                  key={number}
                  initial={{ opacity: 0, x: index === 0 ? -30 : index === 2 ? 30 : 0 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="relative"
                >
                  <div className="relative p-6 rounded-2xl border border-[#2a2a3e] bg-[#0f0f1a] text-center">
                    {/* Step Number */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff] flex items-center justify-center text-sm font-bold text-white">
                      {index + 1}
                    </div>

                    {/* Icon */}
                    <div className="w-16 h-16 mx-auto my-6 rounded-2xl bg-[#0066ff]/10 border border-[#0066ff]/20 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-[#00d4ff]" />
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-2">
                      {title}
                    </h3>
                    <p className="text-white/60 text-sm">{description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00d4ff]/5 to-transparent" />

        <div className="relative z-10 container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent <span className="gradient-text">Pricing</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Choose the plan that fits your needs. Start free, upgrade anytime.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative p-6 rounded-2xl border ${
                  plan.isPopular
                    ? "border-[#0066ff] shadow-lg shadow-[#0066ff]/20 bg-gradient-to-br from-[#0066ff]/10 to-[#00d4ff]/5"
                    : "border-[#2a2a3e] bg-[#0f0f1a]/50"
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff] text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}

                <h3 className="text-xl font-bold text-white mt-2">{plan.name}</h3>

                <div className="my-4">
                  <span className="text-3xl font-bold text-white">
                    ${plan.monthlyPrice}
                  </span>
                  <span className="text-white/50">/month</span>
                </div>

                <div className="mb-6 p-3 rounded-lg bg-white/5 text-center">
                  <span className="text-[#00d4ff] font-medium">
                    {typeof plan.credits === 'number' ? plan.credits.toLocaleString() : plan.credits}
                  </span>
                  <span className="text-white/60 text-sm"> credits</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <svg
                        className="w-4 h-4 text-[#00d4ff] mt-0.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.isPopular ? "default" : "secondary"}
                  className="w-full"
                >
                  {plan.ctaText}
                </Button>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Button variant="link" asChild>
              <Link href="/pricing" className="text-[#00d4ff]">
                See Full Pricing Details
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Loved by <span className="gradient-text">Thousands</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Join the community of creators and developers transforming their workflow
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-2xl border border-[#2a2a3e] bg-[#0f0f1a]/50 backdrop-blur-sm"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff] flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-xs text-white/50">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0066ff]/20 via-[#00d4ff]/10 to-[#0066ff]/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0066ff]/20 rounded-full blur-[128px]" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to <span className="gradient-text">Get Started</span>?
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto mb-10">
              Join thousands of users already creating amazing content with DUALAIHUB.
              No credit card required to start your free trial.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#0066ff] to-[#00d4ff] text-white shadow-lg shadow-[#0066ff]/30 hover:shadow-[#0066ff]/50"
                asChild
              >
                <Link href="/register">
                  Start Creating Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/demo">
                  Watch Demo
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
