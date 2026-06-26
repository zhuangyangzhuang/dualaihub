"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, Image, Music, Video, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface OutputContent {
  type: "text" | "image" | "audio" | "video";
  content: string | string[];
  metadata?: Record<string, unknown>;
}

interface OutputDisplayProps {
  output: OutputContent | null;
  isLoading?: boolean;
  className?: string;
}

const skeletonLines = [
  "bg-gradient-to-r from-white/5 via-white/10 to-white/5",
  "bg-gradient-to-r from-white/5 via-white/8 to-white/5",
  "bg-gradient-to-r from-white/5 via-white/10 to-white/5",
  "bg-gradient-to-r from-white/5 via-white/8 to-white/5",
];

function LoadingSkeleton() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0066ff]" />
        </div>
        <div className="space-y-3">
          {skeletonLines.map((gradient, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn("h-4 w-full rounded-md", gradient)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10"
      >
        <AlertCircle className="h-8 w-8 text-red-500" />
      </motion.div>
      <div>
        <h3 className="text-lg font-medium text-white">Generation Failed</h3>
        <p className="mt-1 text-sm text-white/50">{message}</p>
      </div>
      <Badge variant="destructive">Error</Badge>
    </div>
  );
}

function TextOutput({ content }: { content: string }) {
  return (
    <div className="h-full overflow-auto p-6">
      <motion.pre
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-white/90"
      >
        {content}
      </motion.pre>
    </div>
  );
}

function ImageOutput({ content }: { content: string | string[] }) {
  const images = Array.isArray(content) ? content : [content];

  return (
    <div className="h-full overflow-auto p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((url, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5"
          >
            <img
              src={url}
              alt={`Generated image ${i + 1}`}
              className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="p-4">
                <Badge variant="default" className="mb-2">
                  <Image className="mr-1 h-3 w-3" />
                  Image {i + 1}
                </Badge>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AudioOutput({ content }: { content: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-[#0066ff]/20 to-[#00d4ff]/20">
          <Music className="h-16 w-16 text-[#00d4ff]" />
        </div>
        <div className="absolute inset-0 animate-glow-pulse rounded-full bg-[#0066ff]/10" />
      </motion.div>

      <div className="w-full max-w-md">
        <audio controls className="h-12 w-full">
          <source src={content} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </div>

      <Badge variant="accent">
        <Music className="mr-1 h-3 w-3" />
        Audio Generated
      </Badge>
    </div>
  );
}

function VideoOutput({ content }: { content: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10"
      >
        <video
          controls
          className="w-full bg-black"
          poster="https://picsum.photos/1280/720"
        >
          <source src={content} type="video/mp4" />
          Your browser does not support the video element.
        </video>
        <div className="absolute left-4 top-4">
          <Badge variant="default">
            <Video className="mr-1 h-3 w-3" />
            Video
          </Badge>
        </div>
      </motion.div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5"
      >
        <FileText className="h-10 w-10 text-white/20" />
      </motion.div>
      <div>
        <h3 className="text-lg font-medium text-white/70">No Output Yet</h3>
        <p className="mt-1 text-sm text-white/40">
          Enter a prompt and click Generate to create content
        </p>
      </div>
    </div>
  );
}

export function OutputDisplay({ output, isLoading, className }: OutputDisplayProps) {
  if (isLoading) {
    return (
      <div className={cn("h-full", className)}>
        <LoadingSkeleton />
      </div>
    );
  }

  if (!output) {
    return (
      <div className={cn("h-full", className)}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={cn("h-full", className)}>
      {output.type === "text" && typeof output.content === "string" && (
        <TextOutput content={output.content} />
      )}
      {output.type === "image" && (
        <ImageOutput content={output.content} />
      )}
      {output.type === "audio" && typeof output.content === "string" && (
        <AudioOutput content={output.content} />
      )}
      {output.type === "video" && typeof output.content === "string" && (
        <VideoOutput content={output.content} />
      )}
    </div>
  );
}
