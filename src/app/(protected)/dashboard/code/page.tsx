"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Copy, RefreshCw, Download, Code2 } from "lucide-react";
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

interface OutputContent {
  type: "text" | "image" | "audio" | "video";
  content: string | string[];
  metadata?: Record<string, unknown>;
}

const languages = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
];

const mockCodeOutputs: Record<string, string> = {
  javascript: `// Generated JavaScript Code
async function fetchUserData(userId) {
  try {
    const response = await fetch(\`/api/users/\${userId}\`);
    if (!response.ok) {
      throw new Error('User not found');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// Usage example
fetchUserData(123)
  .then(user => console.log('User:', user))
  .catch(err => console.error('Failed:', err));`,
  typescript: `// Generated TypeScript Code
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

async function fetchUser(userId: number): Promise<User> {
  const response = await fetch(\`/api/users/\${userId}\`);
  
  if (!response.ok) {
    throw new Error(\`Failed to fetch user: \${response.status}\`);
  }
  
  return response.json();
}

// Usage
const user = await fetchUser(123);
console.log(\`User: \${user.name}\`);`,
  python: `# Generated Python Code
from typing import Optional, List
import asyncio

class UserService:
    def __init__(self, db_connection):
        self.db = db_connection
    
    async def get_user(self, user_id: int) -> Optional[dict]:
        query = "SELECT * FROM users WHERE id = ?"
        result = await self.db.execute(query, (user_id,))
        return result.fetchone()
    
    async def get_all_users(self) -> List[dict]:
        query = "SELECT id, name, email FROM users"
        results = await self.db.execute(query)
        return [dict(row) for row in results]

# Usage
service = UserService(db)
user = await service.get_user(123)`,
  default: `// Generated Code
// Select a specific language to see the code example

function example() {
  console.log("Hello, World!");
}`,
};

export default function CodePage() {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("auto");
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [language, setLanguage] = useState("javascript");
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
      { progress: 20, message: "Analyzing code request..." },
      { progress: 45, message: "Selecting optimal model..." },
      { progress: 70, message: "Generating code..." },
      { progress: 90, message: "Applying best practices..." },
      { progress: 100, message: "Complete!" },
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setProgress(step.progress);
      setProgressMessage(step.message);
    }

    const mockOutput: OutputContent = {
      type: "text",
      content: mockCodeOutputs[language] || mockCodeOutputs.default,
      metadata: { model: selectedModel, language },
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
      const extensions: Record<string, string> = {
        javascript: "js",
        typescript: "ts",
        python: "py",
        java: "java",
        cpp: "cpp",
        csharp: "cs",
        go: "go",
        rust: "rs",
        ruby: "rb",
        php: "php",
        swift: "swift",
        kotlin: "kt",
        sql: "sql",
        html: "html",
        css: "css",
      };
      const blob = new Blob([output.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `generated-code-${Date.now()}.${extensions[language] || "txt"}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
            <Code2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Code AI</h1>
            <p className="text-sm text-white/60">Generate and debug code</p>
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
          {/* Language Selector */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-white/70">
              Programming Language
            </label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0f] border-white/10">
                {languages.map((lang) => (
                  <SelectItem
                    key={lang.value}
                    value={lang.value}
                    className="focus:bg-white/10"
                  >
                    {lang.label}
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
              serviceType="code"
            />
          </div>

          {/* Code Input */}
          <div className="mb-4 flex-1">
            <label className="mb-2 block text-sm font-medium text-white/70">
              Describe what code you need
            </label>
            <Textarea
              placeholder="e.g., Create a React hook for form validation with email and password fields..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[200px] resize-none font-mono text-sm bg-white/5 border-white/10"
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
                  Generate Code
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
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
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
              <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/60">
                {languages.find((l) => l.value === language)?.label}
              </span>
            </div>
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
