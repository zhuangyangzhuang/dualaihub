"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Copy, RefreshCw, Download, Image, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/ai/ModelSelector";
import { OutputDisplay } from "@/components/ai/OutputDisplay";
import { QuotaGuard } from "@/components/ai/QuotaGuard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StyleType = "realistic" | "artistic" | "anime" | "3d";

interface OutputContent {
  type: "text" | "image" | "audio" | "video";
  content: string | string[];
  metadata?: Record<string, unknown>;
}

const styles: { value: StyleType; label: string; description: string; color: string }[] = [
  {
    value: "realistic",
    label: "Realistic",
    description: "Photorealistic images",
    color: "from-amber-500 to-orange-500",
  },
  {
    value: "artistic",
    label: "Artistic",
    description: "Paintings and illustrations",
    color: "from-violet-500 to-purple-500",
  },
  {
    value: "anime",
    label: "Anime",
    description: "Japanese animation style",
    color: "from-pink-500 to-rose-500",
  },
  {
    value: "3d",
    label: "3D",
    description: "Three-dimensional render",
    color: "from-cyan-500 to-blue-500",
  },
];

const aspectRatios = [
  { value: "1:1", label: "Square (1:1)", icon: "■" },
  { value: "16:9", label: "Landscape (16:9)", icon: "▬" },
  { value: "9:16", label: "Portrait (9:16)", icon: "▮" },
  { value: "4:3", label: "Standard (4:3)", icon: "▣" },
];

const mockImageUrls = [
  "https://picsum.photos/1024/1024?random=1",
  "https://picsum.photos/1024/1024?random=2",
  "https://picsum.photos/1024/1024?random=3",
  "https://picsum.photos/1024/1024?random=4",
];

export default function ImagePage() {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("auto");
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [selectedStyle, setSelectedStyle] = useState<StyleType>("realistic");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageCount, setImageCount] = useState("1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [output, setOutput] = useState<OutputContent | null>(null);
  const [progressMessage, setProgressMessage] = useState("");

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setIsGenerating(true);
    setProgress(0);
    setOutput(null);

    const steps = [
      { progress: 20, message: "Processing prompt..." },
      { progress: 45, message: "Generating image..." },
      { progress: 70, message: "Applying style..." },
      { progress: 90, message: "Finalizing..." },
      { progress: 100, message: "Complete!" },
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProgress(step.progress);
      setProgressMessage(step.message);
    }

    const count = parseInt(imageCount);
    const images = mockImageUrls.slice(0, count);

    const mockOutput: OutputContent = {
      type: "image",
      content: count === 1 ? images[0] : images,
      metadata: { model: selectedModel, style: selectedStyle, aspectRatio },
    };

    setOutput(mockOutput);
    setIsGenerating(false);
  };

  const handleRegenerate = () => {
    setOutput(null);
    handleGenerate();
  };

  const selectedStyleData = styles.find((s) => s.value === selectedStyle);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
            <Image className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Image AI</h1>
            <p className="text-sm text-white/60">Create stunning images</p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col rounded-2xl border border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl lg:flex-row"
      >
        {/* Input Panel */}
        <div className="flex w-full flex-col border-b border-white/10 p-6 lg:w-1/2 lg:border-b-0 lg:border-r">
          {/* Style Selector */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-white/70">
              <Palette className="inline h-4 w-4 mr-1" />
              Image Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {styles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setSelectedStyle(style.value)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-all",
                    selectedStyle === style.value
                      ? "border-[#0066ff] bg-[#0066ff]/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  )}
                >
                  <div
                    className={cn(
                      "mb-2 h-8 w-8 rounded-lg bg-gradient-to-br",
                      style.color
                    )}
                  />
                  <div className="text-sm font-medium text-white">
                    {style.label}
                  </div>
                  <div className="text-xs text-white/50">
                    {style.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio & Count */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">
                Aspect Ratio
              </label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0f] border-white/10">
                  {aspectRatios.map((ratio) => (
                    <SelectItem
                      key={ratio.value}
                      value={ratio.value}
                      className="focus:bg-white/10"
                    >
                      {ratio.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">
                Number of Images
              </label>
              <Select value={imageCount} onValueChange={setImageCount}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0f] border-white/10">
                  <SelectItem value="1" className="focus:bg-white/10">1 image</SelectItem>
                  <SelectItem value="2" className="focus:bg-white/10">2 images</SelectItem>
                  <SelectItem value="4" className="focus:bg-white/10">4 images</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Model Selector */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-white/70">
              AI Model
            </label>
            <ModelSelector
              value={selectedModel}
              onChange={setSelectedModel}
              mode={mode}
              onModeChange={setMode}
              serviceType="image"
            />
          </div>

          {/* Prompt Input */}
          <div className="mb-4 flex-1">
            <label className="mb-2 block text-sm font-medium text-white/70">
              Describe your image
            </label>
            <Textarea
              placeholder="e.g., A majestic mountain landscape at sunset with snow-capped peaks..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[150px] resize-none bg-white/5 border-white/10"
            />
          </div>

          {/* Generate Button */}
          <QuotaGuard
            modelId={selectedModel}
            fallback={
              <div className="text-center text-sm text-white/50 py-4">
                Insufficient credits to generate
              </div>
            }
          >
            <Button
              onClick={handleGenerate}
              disabled={!input.trim() || isGenerating}
              isLoading={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {progressMessage}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate {selectedStyleData?.label} Image
                </>
              )}
            </Button>
          </QuotaGuard>

          {/* Progress */}
          {isGenerating && (
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-xs text-white/50">
                <span>{progressMessage}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className={cn(
                    "h-full bg-gradient-to-r",
                    selectedStyleData?.color || "from-[#0066ff] to-[#00d4ff]"
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* Output Panel */}
        <div className="flex w-full flex-col p-6 lg:w-1/2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-white/70">Output</h3>
              {selectedStyleData && (
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-xs text-white bg-gradient-to-r",
                    selectedStyleData.color
                  )}
                >
                  {selectedStyleData.label}
                </span>
              )}
            </div>
            {output && (
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={handleRegenerate}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleRegenerate}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <OutputDisplay output={output} isLoading={isGenerating} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
