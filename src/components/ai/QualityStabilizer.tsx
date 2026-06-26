"use client";

import React from "react";
import { motion } from "framer-motion";
import { Settings2, Film, Shield, Gauge, Ratio, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface QualitySettings {
  quality: "Standard" | "HD" | "4K";
  antiDistortion: boolean;
  stabilizationLevel: number;
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:3";
  fps: number;
}

interface QualityStabilizerProps {
  settings: QualitySettings;
  onChange: (settings: QualitySettings) => void;
  className?: string;
}

const qualityOptions: Array<{ value: QualitySettings["quality"]; label: string; badge: string }> = [
  { value: "Standard", label: "Standard", badge: "720p" },
  { value: "HD", label: "HD", badge: "1080p" },
  { value: "4K", label: "4K", badge: "2160p" },
];

const aspectRatioOptions: Array<{ value: QualitySettings["aspectRatio"]; label: string; icon: React.ReactNode }> = [
  { value: "16:9", label: "16:9", icon: <div className="h-3 w-5 rounded-sm bg-current" /> },
  { value: "9:16", label: "9:16", icon: <div className="h-5 w-3 rounded-sm bg-current" /> },
  { value: "1:1", label: "1:1", icon: <div className="h-4 w-4 rounded-sm bg-current" /> },
  { value: "4:3", label: "4:3", icon: <div className="h-3 w-4 rounded-sm bg-current" /> },
];

const fpsOptions = [24, 30, 60];

export function QualityStabilizer({ settings, onChange, className }: QualityStabilizerProps) {
  const updateSetting = <K extends keyof QualitySettings>(
    key: K,
    value: QualitySettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 p-4 space-y-4",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Settings2 className="h-4 w-4 text-[#0066ff]" />
        <h4 className="text-sm font-medium text-white/70">Quality Settings</h4>
      </div>

      <Tabs defaultValue="quality" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="quality" className="text-xs">
            <Film className="mr-1 h-3 w-3" />
            Quality
          </TabsTrigger>
          <TabsTrigger value="stabilize" className="text-xs">
            <Shield className="mr-1 h-3 w-3" />
            Stabilize
          </TabsTrigger>
          <TabsTrigger value="output" className="text-xs">
            <Ratio className="mr-1 h-3 w-3" />
            Output
          </TabsTrigger>
        </TabsList>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div>
            <label className="mb-2 block text-xs text-white/50">
              <Zap className="inline h-3 w-3 mr-1" />
              Video Quality
            </label>
            <div className="grid grid-cols-3 gap-2">
              {qualityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateSetting("quality", option.value)}
                  className={cn(
                    "rounded-lg border p-3 text-center transition-all",
                    settings.quality === option.value
                      ? "border-[#0066ff] bg-[#0066ff]/10 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                  )}
                >
                  <div className="text-sm font-medium">{option.label}</div>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {option.badge}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-white/50">
              <Gauge className="inline h-3 w-3 mr-1" />
              Frame Rate (FPS)
            </label>
            <div className="flex gap-2">
              {fpsOptions.map((fps) => (
                <button
                  key={fps}
                  onClick={() => updateSetting("fps", fps)}
                  className={cn(
                    "flex-1 rounded-lg border p-2 text-center transition-all",
                    settings.fps === fps
                      ? "border-[#0066ff] bg-[#0066ff]/10 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                  )}
                >
                  <div className="text-sm font-medium">{fps}</div>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Stabilize Tab */}
        <TabsContent value="stabilize" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#00d4ff]" />
              <label className="text-sm text-white/70">Anti-Distortion</label>
            </div>
            <Switch
              checked={settings.antiDistortion}
              onCheckedChange={(checked) => updateSetting("antiDistortion", checked)}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs text-white/50">Stabilization Level</label>
              <span className="text-xs text-[#0066ff]">{settings.stabilizationLevel}%</span>
            </div>
            <Slider
              value={[settings.stabilizationLevel]}
              onValueChange={([value]) => updateSetting("stabilizationLevel", value)}
              min={0}
              max={100}
              step={10}
              className="py-2"
            />
            <div className="mt-1 flex justify-between text-xs text-white/30">
              <span>Off</span>
              <span>Maximum</span>
            </div>
          </div>
        </TabsContent>

        {/* Output Tab */}
        <TabsContent value="output" className="space-y-4">
          <div>
            <label className="mb-2 block text-xs text-white/50">Aspect Ratio</label>
            <div className="grid grid-cols-4 gap-2">
              {aspectRatioOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateSetting("aspectRatio", option.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-3 transition-all",
                    settings.aspectRatio === option.value
                      ? "border-[#0066ff] bg-[#0066ff]/10 text-[#00d4ff]"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                  )}
                >
                  {option.icon}
                  <span className="text-xs">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
