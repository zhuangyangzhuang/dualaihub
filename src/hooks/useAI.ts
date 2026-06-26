"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";

interface AIRequest {
  prompt: string;
  model?: string;
  taskType?: "realistic" | "creative";
  options?: Record<string, any>;
}

interface AIResponse {
  result: any;
  model: string;
  creditsUsed: number;
}

export function useAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateText = useCallback(async (request: AIRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Text generation failed");
      setResult(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateCode = useCallback(async (request: AIRequest & { language?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Code generation failed");
      setResult(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateImage = useCallback(async (request: AIRequest & { style?: string; size?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Image generation failed");
      setResult(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateMusic = useCallback(async (request: AIRequest & { duration?: number }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Music generation failed");
      setResult(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateVideo = useCallback(async (request: AIRequest & { duration?: number; quality?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Video generation failed");
      setResult(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    isLoading,
    result,
    error,
    generateText,
    generateCode,
    generateImage,
    generateMusic,
    generateVideo,
    reset,
  };
}
