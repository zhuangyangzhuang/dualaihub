"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PricingToggle } from "@/components/pricing/PricingToggle";
import { PricingCard } from "@/components/pricing/PricingCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  CreditCard,
  RefreshCw,
  Shield,
  Zap,
  HelpCircle,
  ChevronDown,
  Coins,
  Image,
  Video,
} from "lucide-react";
import Link from "next/link";
import { MEMBER_CONFIGS, MEMBER_LEVELS, getMemberBenefits } from "@/lib/points/member-config";
import { POINTS_PACKAGES, POINTS_EXCHANGE_RATE, MODEL_POINTS_COST } from "@/lib/points/exchange-rate";

// 四级会员配置映射
const plans = MEMBER_LEVELS.map((level) => {
  const config = MEMBER_CONFIGS[level];
  const benefits = getMemberBenefits(level, 'zh');
  
  return {
    name: config.name,
    nameCN: config.nameCN,
    description: level === 'FREE' ? '体验入门' : level === 'BASIC' ? '个人首选' : level === 'PRO' ? '专业用户' : '企业级',
    monthlyPrice: config.price,
    yearlyPrice: config.priceYearly || config.price * 0.8,
    credits: config.monthlyPoints > 0 ? `${config.monthlyPoints}点/月` : config.dailyTrialPoints > 0 ? `${config.dailyTrialPoints}点/天试用` : '无点数',
    features: benefits,
    isPopular: level === 'PRO',
    badgeText: level === 'PRO' ? '热门' : undefined,
    ctaText: level === 'FREE' ? '免费开始' : '立即订阅',
    level,
  };
});

const faqs = [
  {
    question: "What are credits and how do they work?",
    answer:
      "Credits are the currency used to generate AI content. Different operations consume different amounts of credits based on complexity. For example, a simple text generation might use 1 credit while a 4K video could use 50+ credits.",
  },
  {
    question: "Can I switch plans anytime?",
    answer:
      "Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades will apply at the start of your next billing cycle.",
  },
  {
    question: "Do unused credits roll over?",
    answer:
      "Currently, credits reset each billing period and do not roll over. We recommend choosing a plan that matches your monthly usage.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and USDT cryptocurrency payments.",
  },
  {
    question: "Is there a free trial for paid plans?",
    answer:
      "Yes! Both Starter and Pro plans come with a 7-day free trial. No credit card required to start.",
  },
  {
    question: "What is your refund policy?",
    answer:
      "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team for a full refund.",
  },
  {
    question: "How does dual AI scheduling work?",
    answer:
      "Our proprietary dual AI scheduling system automatically distributes your requests across multiple AI models to optimize for speed and quality. This means faster results without sacrificing output quality.",
  },
  {
    question: "Can I get a refund for unused credits?",
    answer:
      "We do not offer refunds for unused credits, but you can cancel your subscription at any time to prevent future charges.",
  },
];

const features = [
  {
    icon: CreditCard,
    title: "Secure Payment",
    description: "All transactions are encrypted and secure",
  },
  {
    icon: RefreshCw,
    title: "Cancel Anytime",
    description: "No long-term commitments, cancel anytime",
  },
  {
    icon: Shield,
    title: "Money-Back Guarantee",
    description: "30-day money-back guarantee on all plans",
  },
  {
    icon: Zap,
    title: "Instant Activation",
    description: "Start using your plan immediately after signup",
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  const handleCTAClick = (planName: string) => {
    // Redirect to register/checkout
    console.log(`Subscribe to ${planName}`);
  };

  return (
    <div className="min-h-screen w-full overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0066ff]/5 to-[#0a0a0f]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0066ff]/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00d4ff]/10 rounded-full blur-[128px]" />
      </div>

      {/* Header */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              简单透明 <span className="gradient-text">定价方案</span>
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8">
              选择适合您的完美方案。所有方案均包含双AI调度技术访问权限
            </p>

            {/* Toggle */}
            <PricingToggle isYearly={isYearly} onToggle={setIsYearly} />
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 pb-20">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <PricingCard
                  name={plan.name}
                  description={plan.description}
                  monthlyPrice={plan.monthlyPrice}
                  yearlyPrice={plan.yearlyPrice}
                  credits={plan.credits}
                  features={plan.features}
                  isYearly={isYearly}
                  isPopular={plan.isPopular}
                  badgeText={plan.badgeText}
                  onCTAClick={() => handleCTAClick(plan.name)}
                  ctaText={plan.ctaText}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Points Store Section */}
      <section className="px-4 py-20 border-t border-[#2a2a3e]">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center gap-2 mb-4">
              <Coins className="w-8 h-8 text-[#00d4ff]" />
              <h2 className="text-4xl font-bold text-white">
                Points Store <span className="gradient-text">点数商店</span>
              </h2>
            </div>
            <p className="text-white/60 max-w-2xl mx-auto mb-4">
              按次付费，灵活使用。所有用户（包括会员）均可使用点数购买额外额度
            </p>
            <p className="text-white/40 text-sm">
              All users (including members) can use points for additional usage beyond their quota
            </p>
          </motion.div>

          {/* Points Packages */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {POINTS_PACKAGES.map((pkg) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative rounded-2xl border border-[#2a2a3e] bg-[#0f0f1a] p-6 text-center hover:border-[#0066ff]/30 transition-all duration-300"
              >
                {pkg.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="bg-gradient-to-r from-[#0066ff] to-[#00d4ff] shadow-lg shadow-[#0066ff]/20">
                      {pkg.badge}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Coins className="w-5 h-5 text-[#00d4ff]" />
                  <span className="text-3xl font-bold text-white">{pkg.points}</span>
                </div>
                <p className="text-white/60 text-sm mb-4">points</p>
                <div className="text-2xl font-bold text-white">
                  ${pkg.price}
                </div>
                {pkg.discount && (
                  <p className="text-white/40 text-sm mb-4">省 {pkg.discount}%</p>
                )}
                <Button
                  variant="secondary"
                  className="w-full mt-4"
                  onClick={() => console.log(`Buy ${pkg.points} points`)}
                >
                  购买
                </Button>
              </motion.div>
            ))}
          </div>

          {/* 自定义充值说明 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <p className="text-white/60">
              自定义金额充值：<span className="text-[#00d4ff]">1美元 = {POINTS_EXCHANGE_RATE.POINTS_PER_DOLLAR}点</span>
            </p>
          </motion.div>

          {/* Points Usage / Consumption Guide */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-[#2a2a3e] bg-[#0f0f1a]/50 p-8"
          >
            <h3 className="text-xl font-bold text-white text-center mb-6">
              消费指南 <span className="text-white/60 font-normal">Consumption Guide</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 高端文字 */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
                <div className="w-10 h-10 rounded-lg bg-[#0066ff]/10 border border-[#0066ff]/20 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-[#00d4ff]" />
                </div>
                <div>
                  <p className="font-medium text-white">高端文字模型</p>
                  <p className="text-white/60 text-sm">GPT-4o、Claude、Midjourney</p>
                  <p className="text-[#00d4ff] text-sm mt-1">
                    {MODEL_POINTS_COST.text.premium[0].points}点/次 （{MODEL_POINTS_COST.text.premium[0].multiplier}倍暴利）
                  </p>
                </div>
              </div>
              {/* Midjourney 绘图 */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
                <div className="w-10 h-10 rounded-lg bg-[#0066ff]/10 border border-[#0066ff]/20 flex items-center justify-center shrink-0">
                  <Image className="w-5 h-5 text-[#00d4ff]" />
                </div>
                <div>
                  <p className="font-medium text-white">Midjourney 绘图</p>
                  <p className="text-white/60 text-sm">Flux Pro、DALL-E 3</p>
                  <p className="text-[#00d4ff] text-sm mt-1">
                    {MODEL_POINTS_COST.image.premium[0].points}点/张 （{MODEL_POINTS_COST.image.premium[0].multiplier}倍暴利）
                  </p>
                </div>
              </div>
              {/* 普通短剧 */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
                <div className="w-10 h-10 rounded-lg bg-[#0066ff]/10 border border-[#0066ff]/20 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5 text-[#00d4ff]" />
                </div>
                <div>
                  <p className="font-medium text-white">普通短剧制作</p>
                  <p className="text-white/60 text-sm">Pika、Runway、可灵AI</p>
                  <p className="text-[#00d4ff] text-sm mt-1">
                    {MODEL_POINTS_COST.video.basic[0].points}点/条 （{MODEL_POINTS_COST.video.basic[0].multiplier}倍暴利）
                  </p>
                </div>
              </div>
              {/* 超清短剧 */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
                <div className="w-10 h-10 rounded-lg bg-[#0066ff]/10 border border-[#0066ff]/20 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5 text-[#00d4ff]" />
                </div>
                <div>
                  <p className="font-medium text-white">超清影视级短剧</p>
                  <p className="text-white/60 text-sm">Sora、AI短剧制作、Pika HD</p>
                  <p className="text-[#00d4ff] text-sm mt-1">
                    {MODEL_POINTS_COST.video.premium[0].points}点/条 （{MODEL_POINTS_COST.video.premium[0].multiplier}倍暴利）
                  </p>
                </div>
              </div>
            </div>
            <p className="text-white/40 text-sm text-center mt-6">
              * 点数永久有效，跨月累计
            </p>
          </motion.div>
        </div>
      </section>

      {/* Trust Features */}
      <section className="px-4 py-20 border-t border-[#2a2a3e]">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {features.map(({ icon: Icon, title, description }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#0066ff]/10 border border-[#0066ff]/20 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#00d4ff]" />
                </div>
                <h3 className="font-semibold text-white mb-1">{title}</h3>
                <p className="text-white/50 text-sm">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-white/60">
              Can&apos;t find the answer you&apos;re looking for?{" "}
              <Link href="/contact" className="text-[#00d4ff] hover:underline">
                Contact our support team
              </Link>
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-32">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden p-12 md:p-16 text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(0, 102, 255, 0.2) 0%, rgba(0, 212, 255, 0.1) 100%)",
              border: "1px solid rgba(0, 102, 255, 0.3)",
            }}
          >
            <div className="relative z-10">
              <MessageSquare className="w-12 h-12 text-[#00d4ff] mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Still have questions?
              </h2>
              <p className="text-white/70 mb-8 max-w-xl mx-auto">
                Our team is here to help. Get in touch and we&apos;ll answer any
                questions you have about our pricing or plans.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#0066ff] to-[#00d4ff] text-white"
                  asChild
                >
                  <Link href="/contact">Contact Support</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/register">Start Free Trial</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function FAQItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="rounded-xl border border-[#2a2a3e] bg-[#0f0f1a]/50 overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
      >
        <span className="font-medium text-white pr-4">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-white/50 shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-48" : "max-h-0"
        }`}
      >
        <p className="px-6 pb-4 text-white/60 text-sm leading-relaxed">
          {answer}
        </p>
      </div>
    </motion.div>
  );
}
