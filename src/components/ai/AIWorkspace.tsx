"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  RefreshCw,
  Download,
  Loader2,
  Sparkles,
  Zap,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ModelSelector, SERVICE_CREDIT_COSTS, ServiceCategory } from "./ModelSelector";
import { OutputDisplay } from "./OutputDisplay";
import { QualityStabilizer } from "./QualityStabilizer";
import { QuotaGuard } from "./QuotaGuard";

interface GenerationProgress {
  status: "idle" | "generating" | "completed" | "error";
  progress: number;
  message?: string;
}

interface OutputContent {
  type: "text" | "image" | "audio" | "video";
  content: string | string[];
  metadata?: Record<string, unknown>;
}

interface AIWorkspaceProps {
  className?: string;
}

const GenerationTabs = ["Text", "Image", "Music", "Video"] as const;
type GenerationTab = (typeof GenerationTabs)[number];

const tabToServiceType: Record<GenerationTab, ServiceCategory> = {
  Text: "text",
  Image: "image",
  Music: "music",
  Video: "video",
};

const TAB_CREDIT_COSTS: Record<GenerationTab, number> = {
  Text: 5,
  Image: 8,
  Music: 6,
  Video: 15,
};

const TAB_VIDEO_LIMITS = {
  monthly: 10,
  used: 3,
};

export function AIWorkspace({ className }: AIWorkspaceProps) {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("auto");
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [activeTab, setActiveTab] = useState<GenerationTab>("Text");
  const [progress, setProgress] = useState<GenerationProgress>({
    status: "idle",
    progress: 0,
  });
  const [output, setOutput] = useState<OutputContent | null>(null);
  const [qualitySettings, setQualitySettings] = useState({
    quality: "HD" as "Standard" | "HD" | "4K",
    antiDistortion: true,
    stabilizationLevel: 50,
    aspectRatio: "16:9" as "16:9" | "9:16" | "1:1" | "4:3",
    fps: 30,
  });

  const serviceType = tabToServiceType[activeTab];
  const requiredCredits = TAB_CREDIT_COSTS[activeTab];

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setProgress({ status: "generating", progress: 0, message: "Initializing..." });

    // Simulate generation progress
    const steps = [
      { progress: 20, message: "Processing request..." },
      { progress: 45, message: "AI is thinking..." },
      { progress: 70, message: "Generating content..." },
      { progress: 90, message: "Finalizing..." },
      { progress: 100, message: "Complete!" },
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setProgress({ status: "generating", progress: step.progress, message: step.message });
    }

    // Mock output based on tab type
    const mockOutput: OutputContent = {
      type: activeTab === "Text" ? "text" : activeTab === "Image" ? "image" : activeTab === "Music" ? "audio" : "video",
      content:
        activeTab === "Text"
          ? "This is a sample generated text response from the AI model. The content has been processed and formatted for your review."
          : "https://picsum.photos/1024/1024",
    };

    setOutput(mockOutput);
    setProgress({ status: "completed", progress: 100 });
  };

  const handleCopy = () => {
    if (output?.type === "text" && typeof output.content === "string") {
      navigator.clipboard.writeText(output.content);
    }
  };

  const handleRegenerate = () => {
    setOutput(null);
    setProgress({ status: "idle", progress: 0 });
    handleGenerate();
  };

  const handleDownload = () => {
    // Implement download logic based on output type
    console.log("Downloading...");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex h-[calc(100vh-120px)] flex-col rounded-2xl border border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0066ff] to-[#00d4ff]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">AI Workspace</h2>
            <p className="text-sm text-white/50">Generate content with AI</p>
          </div>
        </div>
        
        {/* Mode Indicator */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium",
              mode === "auto"
                ? "bg-gradient-to-r from-[#0066ff]/20 to-[#00d4ff]/20 border border-[#0066ff]/30"
                : "bg-gradient-to-r from-[#00d4ff]/20 to-[#00ff88]/20 border border-[#00d4ff]/30"
            )}
          >
            {mode === "auto" ? (
              <>
                <Zap className="h-3 w-3 text-[#00d4ff]" />
                <span className="text-white/80">智能择优模式</span>
              </>
            ) : (
              <>
                <Cpu className="h-3 w-3 text-[#00d4ff]" />
                <span className="text-white/80">手动选择模式</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <ModelSelector
          value={selectedModel}
          onChange={setSelectedModel}
          mode={mode}
          onModeChange={setMode}
          serviceType={serviceType}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Input Panel - Left */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex w-full flex-col border-b border-white/10 p-6 lg:w-1/2 lg:border-b-0 lg:border-r"
        >
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as GenerationTab)}
            className="flex flex-col"
          >
            <TabsList className="mb-4 grid w-full grid-cols-4">
              {GenerationTabs.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="flex-1">
              <div className="flex h-full flex-col gap-4">
                <Textarea
                  placeholder={`Enter your ${activeTab.toLowerCase()} prompt here...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 resize-none"
                />

                {(activeTab === "Video" || activeTab === "Image") && (
                  <QualityStabilizer
                    settings={qualitySettings}
                    onChange={setQualitySettings}
                  />
                )}

                <QuotaGuard
                  modelId={selectedModel || "auto"}
                  fallback={
                    <div className="text-center text-sm text-white/50">
                      积分不足，无法生成
                    </div>
                  }
                >
                  {activeTab === "Video" && (
                    <div className="mb-3 rounded-lg bg-[#ff9500]/10 border border-[#ff9500]/20 px-3 py-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/60">本月视频额度</span>
                        <span className="text-[#ff9500]">
                          已使用 {TAB_VIDEO_LIMITS.used}/{TAB_VIDEO_LIMITS.monthly} 次
                        </span>
                      </div>
                      <Progress
                        value={(TAB_VIDEO_LIMITS.used / TAB_VIDEO_LIMITS.monthly) * 100}
                        className="mt-2 h-1.5"
                      />
                    </div>
                  )}
                  <Button
                    onClick={handleGenerate}
                    disabled={!input.trim() || progress.status === "generating"}
                    isLoading={progress.status === "generating"}
                    className="w-full"
                  >
                    {progress.status === "generating" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {progress.message}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        生成 {activeTab}
                        <Badge variant="secondary" className="ml-2 bg-white/10 text-xs">
                          {requiredCredits}积分
                        </Badge>
                      </>
                    )}
                  </Button>
                </QuotaGuard>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Output Panel - Right */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex w-full flex-col p-6 lg:w-1/2"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/70">Output</h3>
            {output && (
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleRegenerate}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {progress.status === "generating" && (
            <div className="mb-4 space-y-2">
              <Progress value={progress.progress} />
              <p className="text-xs text-white/50">{progress.message}</p>
            </div>
          )}

          {/* Output Display */}
          <div className="flex-1 overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <OutputDisplay output={output} isLoading={progress.status === "generating"} />
          </div>
        </motion.div>
      </div>

      {/* Responsive Mobile Layout */}
      <div className="flex flex-col gap-4 p-4 lg:hidden">
        {progress.status === "generating" && (
          <Progress value={progress.progress} />
        )}
      </div>
    </motion.div>
  );
}
