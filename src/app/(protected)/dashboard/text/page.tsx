"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Copy, RefreshCw, Download, FileText } from "lucide-react";
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

type TaskType = "writing" | "rewriting" | "summarization" | "translation";

interface OutputContent {
  type: "text" | "image" | "audio" | "video";
  content: string | string[];
  metadata?: Record<string, unknown>;
}

const taskTypes: { value: TaskType; label: string; description: string }[] = [
  { value: "writing", label: "Writing", description: "Generate new content from scratch" },
  { value: "rewriting", label: "Rewriting", description: "Improve existing text" },
  { value: "summarization", label: "Summarization", description: "Condense long text" },
  { value: "translation", label: "Translation", description: "Translate between languages" },
];

const mockOutputs: Record<TaskType, string> = {
  writing: "This is a sample generated text response from the AI model. The content has been processed and formatted for your review. It demonstrates the model's capability to generate coherent and contextually appropriate text based on your input.\n\nThe generated content includes multiple paragraphs to give you a comprehensive view of what to expect from the AI's capabilities. Feel free to regenerate if you'd like to see different results.",
  rewriting: "This is an improved version of your original text. The rewriting has enhanced clarity, flow, and overall quality while maintaining the core message and intent of the original content.\n\nKey improvements include better sentence structure, more engaging vocabulary, and improved logical progression of ideas throughout the text.",
  summarization: "This is a condensed summary of your input text. The key points have been extracted and presented in a concise format that captures the essential information.\n\n• Main topic: AI text generation\n• Key points: 3 main concepts covered\n• Conclusion: Actionable insights provided",
  translation: "This is a translated version of your input text. The translation maintains the original meaning while adapting to natural language patterns in the target language.\n\nThe translation has been carefully crafted to preserve nuance and ensure readability for native speakers.",
};

export default function TextPage() {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("auto");
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [taskType, setTaskType] = useState<TaskType>("writing");
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
      { progress: 20, message: "Analyzing input..." },
      { progress: 45, message: "Processing with AI model..." },
      { progress: 70, message: "Generating content..." },
      { progress: 90, message: "Finalizing output..." },
      { progress: 100, message: "Complete!" },
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setProgress(step.progress);
      setProgressMessage(step.message);
    }

    const mockOutput: OutputContent = {
      type: "text",
      content: mockOutputs[taskType],
      metadata: { model: selectedModel, taskType },
    };

    setOutput(mockOutput);
    setIsGenerating(false);
  };

  const handleCopy = () => {
    if (output?.type === "text" && typeof output.content === "string") {
      navigator.clipboard.writeText(output.content);
    }
  };

  const handleRegenerate = () => {
    setOutput(null);
    handleGenerate();
  };

  const handleDownload = () => {
    if (output?.type === "text" && typeof output.content === "string") {
      const blob = new Blob([output.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `generated-text-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const selectedTask = taskTypes.find((t) => t.value === taskType);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Text AI</h1>
            <p className="text-sm text-white/60">Generate and enhance text content</p>
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
          {/* Task Type Selector */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-white/70">
              Task Type
            </label>
            <Select
              value={taskType}
              onValueChange={(v) => setTaskType(v as TaskType)}
            >
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0f] border-white/10">
                {taskTypes.map((type) => (
                  <SelectItem
                    key={type.value}
                    value={type.value}
                    className="focus:bg-white/10"
                  >
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-white/50">
                        {type.description}
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
              serviceType="text"
            />
          </div>

          {/* Text Input */}
          <div className="mb-4 flex-1">
            <label className="mb-2 block text-sm font-medium text-white/70">
              {taskType === "writing"
                ? "Enter your prompt"
                : taskType === "rewriting"
                ? "Enter text to rewrite"
                : taskType === "summarization"
                ? "Enter text to summarize"
                : "Enter text to translate"}
            </label>
            <Textarea
              placeholder={
                taskType === "writing"
                  ? "Describe what you want to write about..."
                  : taskType === "rewriting"
                  ? "Paste the text you want to improve..."
                  : taskType === "summarization"
                  ? "Paste the text you want to summarize..."
                  : "Enter text to translate..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[200px] resize-none bg-white/5 border-white/10"
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
                  Generate {selectedTask?.label}
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

          <div className="flex-1 overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <OutputDisplay output={output} isLoading={isGenerating} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
