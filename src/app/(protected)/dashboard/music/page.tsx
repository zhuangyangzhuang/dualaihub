"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Music, Clock, Disc3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/ai/ModelSelector";
import { QuotaGuard } from "@/components/ai/QuotaGuard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type DurationType = "30s" | "60s" | "180s";

interface OutputContent {
  type: "text" | "image" | "audio" | "video";
  content: string | string[];
  metadata?: Record<string, unknown>;
}

const durations: { value: DurationType; label: string; seconds: number }[] = [
  { value: "30s", label: "30 seconds", seconds: 30 },
  { value: "60s", label: "1 minute", seconds: 60 },
  { value: "180s", label: "3 minutes", seconds: 180 },
];

const musicStyles = [
  { value: "ambient", label: "Ambient", description: "Calm and atmospheric" },
  { value: "electronic", label: "Electronic", description: "Synth and beats" },
  { value: "orchestral", label: "Orchestral", description: "Classical instruments" },
  { value: "lofi", label: "Lo-Fi", description: "Chill hip-hop beats" },
  { value: "rock", label: "Rock", description: "Guitar and drums" },
  { value: "jazz", label: "Jazz", description: "Smooth jazz vibes" },
  { value: "cinematic", label: "Cinematic", description: "Movie soundtrack" },
  { value: "folk", label: "Folk", description: "Acoustic and natural" },
];

export default function MusicPage() {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("auto");
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [duration, setDuration] = useState<DurationType>("60s");
  const [style, setStyle] = useState("ambient");
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
      { progress: 15, message: "Composing melody..." },
      { progress: 35, message: "Adding harmonies..." },
      { progress: 55, message: "Mixing tracks..." },
      { progress: 75, message: "Mastering audio..." },
      { progress: 90, message: "Finalizing..." },
      { progress: 100, message: "Complete!" },
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setProgress(step.progress);
      setProgressMessage(step.message);
    }

    // Mock audio URL (placeholder)
    const mockOutput: OutputContent = {
      type: "audio",
      content: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      metadata: { model: selectedModel, duration, style },
    };

    setOutput(mockOutput);
    setIsGenerating(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const selectedDuration = durations.find((d) => d.value === duration);
  const selectedStyleData = musicStyles.find((s) => s.value === style);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
            <Music className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Music AI</h1>
            <p className="text-sm text-white/60">Create original music</p>
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
          {/* Duration Selector */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-white/70">
              <Clock className="inline h-4 w-4 mr-1" />
              Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {durations.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  className={cn(
                    "rounded-lg border p-3 text-center transition-all",
                    duration === d.value
                      ? "border-[#0066ff] bg-[#0066ff]/10 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                  )}
                >
                  <div className="text-sm font-medium">{d.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Style Selector */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-white/70">
              Music Style
            </label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0f] border-white/10">
                {musicStyles.map((s) => (
                  <SelectItem
                    key={s.value}
                    value={s.value}
                    className="focus:bg-white/10"
                  >
                    <div>
                      <div className="font-medium">{s.label}</div>
                      <div className="text-xs text-white/50">
                        {s.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              serviceType="music"
            />
          </div>

          {/* Prompt Input */}
          <div className="mb-4 flex-1">
            <label className="mb-2 block text-sm font-medium text-white/70">
              Describe your music
            </label>
            <Textarea
              placeholder="e.g., Upbeat lo-fi track with piano, vinyl crackle, and soft drums for studying..."
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
                  Generate Music
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
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
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
                <Badge variant="secondary" className="text-xs">
                  <Clock className="mr-1 h-3 w-3" />
                  {selectedDuration?.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Audio Player */}
          <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-6">
            {!output && !isGenerating && (
              <div className="flex h-full flex-col items-center justify-center gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20"
                >
                  <Disc3 className="h-12 w-12 text-green-400/50 animate-spin" style={{ animationDuration: '3s' }} />
                </motion.div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-white/70">No Audio Yet</h3>
                  <p className="mt-1 text-sm text-white/40">
                    Enter a prompt and click Generate to create music
                  </p>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="flex h-full flex-col items-center justify-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="relative"
                >
                  <Disc3 className="h-24 w-24 text-green-400" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-[#0a0a0f]" />
                  </div>
                </motion.div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-white">Generating...</h3>
                  <p className="mt-1 text-sm text-white/50">
                    {progressMessage} ({progress}%)
                  </p>
                </div>
                <div className="mt-4 w-full max-w-xs">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {output && output.type === "audio" && (
              <div className="flex h-full flex-col items-center justify-center gap-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative"
                >
                  <motion.div
                    animate={{ rotate: isPlaying ? 360 : 0 }}
                    transition={{ duration: 3, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
                    className="relative"
                  >
                    <Disc3 className="h-32 w-32 text-green-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-10 w-10 rounded-full bg-[#0a0a0f]" />
                    </div>
                  </motion.div>
                  {isPlaying && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -inset-4 rounded-full border-2 border-green-400/30"
                    />
                  )}
                </motion.div>

                <div className="w-full max-w-md">
                  <audio
                    controls
                    className="w-full"
                    src={output.content as string}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                </div>

                <div className="flex items-center gap-2 text-center">
                  <Badge variant="secondary" className="text-xs">
                    {selectedStyleData?.label}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="mr-1 h-3 w-3" />
                    {selectedDuration?.label}
                  </Badge>
                </div>

                <p className="text-sm text-white/50">
                  Generated with {(output.metadata as any)?.model || "AI Model"}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
