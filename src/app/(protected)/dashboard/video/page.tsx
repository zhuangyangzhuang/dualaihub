"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Video, Clock, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/ai/ModelSelector";
import { QualityStabilizer } from "@/components/ai/QualityStabilizer";
import { QuotaGuard } from "@/components/ai/QuotaGuard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type DurationType = "5s" | "10s" | "15s";

interface QualitySettings {
  quality: "Standard" | "HD" | "4K";
  antiDistortion: boolean;
  stabilizationLevel: number;
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:3";
  fps: number;
}

interface OutputContent {
  type: "text" | "image" | "audio" | "video";
  content: string | string[];
  metadata?: Record<string, unknown>;
}

const durations: { value: DurationType; label: string; seconds: number }[] = [
  { value: "5s", label: "5 seconds", seconds: 5 },
  { value: "10s", label: "10 seconds", seconds: 10 },
  { value: "15s", label: "15 seconds", seconds: 15 },
];

export default function VideoPage() {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("auto");
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [duration, setDuration] = useState<DurationType>("10s");
  const [qualitySettings, setQualitySettings] = useState<QualitySettings>({
    quality: "HD",
    antiDistortion: true,
    stabilizationLevel: 50,
    aspectRatio: "16:9",
    fps: 30,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [output, setOutput] = useState<OutputContent | null>(null);
  const [progressMessage, setProgressMessage] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setIsGenerating(true);
    setProgress(0);
    setOutput(null);
    setIsPlaying(false);

    const steps = [
      { progress: 15, message: "Processing prompt..." },
      { progress: 30, message: "Generating frames..." },
      { progress: 50, message: "Applying motion..." },
      { progress: 70, message: "Adding effects..." },
      { progress: 85, message: "Rendering video..." },
      { progress: 95, message: "Finalizing..." },
      { progress: 100, message: "Complete!" },
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProgress(step.progress);
      setProgressMessage(step.message);
    }

    // Mock video URL (placeholder)
    const mockOutput: OutputContent = {
      type: "video",
      content: "https://www.w3schools.com/html/mov_bbb.mp4",
      metadata: { model: selectedModel, duration, quality: qualitySettings.quality },
    };

    setOutput(mockOutput);
    setIsGenerating(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const selectedDuration = durations.find((d) => d.value === duration);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0066ff] to-[#00d4ff]">
            <Video className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Video AI</h1>
            <p className="text-sm text-white/60">Create stunning videos</p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl"
      >
        {/* Top Bar */}
        <div className="flex flex-col gap-4 border-b border-white/10 p-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Duration Selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">
              <Clock className="inline h-4 w-4 mr-1" />
              Duration
            </label>
            <div className="flex gap-2">
              {durations.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm transition-all",
                    duration === d.value
                      ? "border-[#0066ff] bg-[#0066ff]/10 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model Selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">
              AI Model
            </label>
            <ModelSelector
              value={selectedModel}
              onChange={setSelectedModel}
              mode={mode}
              onModeChange={setMode}
              serviceType="video"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Input Panel */}
          <div className="flex w-full flex-col border-b border-white/10 p-6 lg:w-1/2 lg:border-b-0 lg:border-r">
            {/* Quality Settings */}
            <div className="mb-4">
              <QualityStabilizer
                settings={qualitySettings}
                onChange={setQualitySettings}
              />
            </div>

            {/* Prompt Input */}
            <div className="mb-4 flex-1">
              <label className="mb-2 block text-sm font-medium text-white/70">
                Describe your video
              </label>
              <Textarea
                placeholder="e.g., A serene ocean sunset with gentle waves lapping at the shore, birds flying across a colorful sky..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[120px] resize-none bg-white/5 border-white/10"
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
                    Generate Video
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
                    className="h-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff]"
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
                {output && (
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      {selectedDuration?.label}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {qualitySettings.quality}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Video Player */}
            <div className="flex-1 rounded-xl border border-white/10 bg-black/50 overflow-hidden">
              {!output && !isGenerating && (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5"
                  >
                    <Video className="h-10 w-10 text-white/30" />
                  </motion.div>
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-white/70">No Video Yet</h3>
                    <p className="mt-1 text-sm text-white/40">
                      Enter a prompt and click Generate to create a video
                    </p>
                  </div>
                </div>
              )}

              {isGenerating && (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="h-20 w-20 rounded-full border-2 border-[#0066ff]/30"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                      className="absolute inset-0 h-20 w-20 rounded-full border-2 border-[#00d4ff]/20"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-[#0066ff]" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-white">Generating Video...</h3>
                    <p className="mt-1 text-sm text-white/50">
                      {progressMessage} ({progress}%)
                    </p>
                  </div>
                </div>
              )}

              {output && output.type === "video" && (
                <div className="relative">
                  <video
                    controls
                    className="w-full"
                    poster="https://picsum.photos/1280/720"
                    src={output.content as string}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  <div className="absolute left-4 top-4">
                    <Badge className="bg-gradient-to-r from-[#0066ff] to-[#00d4ff]">
                      <Video className="mr-1 h-3 w-3" />
                      AI Generated
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
