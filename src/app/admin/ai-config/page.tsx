"use client";

import React, { useState } from "react";
import {
  Settings,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Key,
  Activity,
  Zap,
  Brain,
  Image,
  Music,
  Video,
  Code,
  Type,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AIProvider {
  id: string;
  name: string;
  displayName: string;
  icon: React.ElementType;
  color: string;
  apiKey: string;
  enabled: boolean;
  priority: number;
  healthStatus: "healthy" | "degraded" | "down";
  healthMessage: string;
  lastChecked: Date;
  models: string[];
}

const initialProviders: AIProvider[] = [
  {
    id: "openai",
    name: "openai",
    displayName: "OpenAI",
    icon: Brain,
    color: "#10a37f",
    apiKey: "sk-••••••••••••••••••••••••••••••••",
    enabled: true,
    priority: 1,
    healthStatus: "healthy",
    healthMessage: "All systems operational",
    lastChecked: new Date("2024-06-24T10:00:00"),
    models: ["gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
  },
  {
    id: "anthropic",
    name: "anthropic",
    displayName: "Anthropic Claude",
    icon: Brain,
    color: "#d63aff",
    apiKey: "sk-ant-••••••••••••••••••••••••••••",
    enabled: true,
    priority: 2,
    healthStatus: "healthy",
    healthMessage: "All systems operational",
    lastChecked: new Date("2024-06-24T10:00:00"),
    models: ["claude-3-5-sonnet-20240620", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
  },
  {
    id: "zhipu",
    name: "zhipu",
    displayName: "Zhipu AI",
    icon: Zap,
    color: "#0066ff",
    apiKey: "••••••••••••••••••••••••••••••••••••",
    enabled: true,
    priority: 3,
    healthStatus: "healthy",
    healthMessage: "All systems operational",
    lastChecked: new Date("2024-06-24T10:00:00"),
    models: ["glm-4", "glm-4-flash", "glm-4-plus", "glm-3"],
  },
  {
    id: "qwen",
    name: "qwen",
    displayName: "Qwen",
    icon: Code,
    color: "#ff6b00",
    apiKey: "••••••••••••••••••••••••••••••••••••",
    enabled: true,
    priority: 4,
    healthStatus: "degraded",
    healthMessage: "High latency detected",
    lastChecked: new Date("2024-06-24T10:00:00"),
    models: ["qwen-turbo", "qwen-plus", "qwen-max"],
  },
  {
    id: "doubao",
    name: "doubao",
    displayName: "Doubao",
    icon: Type,
    color: "#00d4ff",
    apiKey: "••••••••••••••••••••••••••••••••••••",
    enabled: false,
    priority: 5,
    healthStatus: "healthy",
    healthMessage: "All systems operational",
    lastChecked: new Date("2024-06-24T10:00:00"),
    models: ["doubao-pro-32k", "doubao-standard-32k", "doubao-lite-32k"],
  },
  {
    id: "kimi",
    name: "kimi",
    displayName: "Kimi",
    icon: Brain,
    color: "#8b5cf6",
    apiKey: "••••••••••••••••••••••••••••••••••••",
    enabled: true,
    priority: 6,
    healthStatus: "down",
    healthMessage: "Service unavailable",
    lastChecked: new Date("2024-06-24T10:00:00"),
    models: ["kimi-flash", "kimi-long"],
  },
  {
    id: "pika",
    name: "pika",
    displayName: "Pika",
    icon: Video,
    color: "#f43f5e",
    apiKey: "••••••••••••••••••••••••••••••••••••",
    enabled: true,
    priority: 7,
    healthStatus: "healthy",
    healthMessage: "All systems operational",
    lastChecked: new Date("2024-06-24T10:00:00"),
    models: ["pika-1.0", "pika-1.5"],
  },
  {
    id: "sora",
    name: "sora",
    displayName: "Sora",
    icon: Video,
    color: "#ec4899",
    apiKey: "••••••••••••••••••••••••••••••••••••",
    enabled: false,
    priority: 8,
    healthStatus: "healthy",
    healthMessage: "All systems operational",
    lastChecked: new Date("2024-06-24T10:00:00"),
    models: ["sora-turbo", "sora-pro"],
  },
];

export default function AIConfigPage() {
  const [providers, setProviders] = useState<AIProvider[]>(initialProviders);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const getHealthIcon = (status: AIProvider["healthStatus"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "degraded":
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case "down":
        return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getHealthBadgeVariant = (status: AIProvider["healthStatus"]) => {
    switch (status) {
      case "healthy":
        return "success";
      case "degraded":
        return "secondary";
      case "down":
        return "destructive";
    }
  };

  const handleToggleEnabled = (providerId: string) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId ? { ...p, enabled: !p.enabled } : p
      )
    );
    setLastSaved(new Date());
  };

  const handlePriorityChange = (providerId: string, direction: "up" | "down") => {
    setProviders((prev) => {
      const sorted = [...prev].sort((a, b) => a.priority - b.priority);
      const index = sorted.findIndex((p) => p.id === providerId);
      if (direction === "up" && index > 0) {
        const newPriority = sorted[index].priority - 1;
        sorted[index].priority = newPriority;
        sorted[index - 1].priority = newPriority + 1;
      } else if (direction === "down" && index < sorted.length - 1) {
        const newPriority = sorted[index].priority + 1;
        sorted[index].priority = newPriority;
        sorted[index + 1].priority = newPriority - 1;
      }
      return sorted;
    });
    setLastSaved(new Date());
  };

  const handleEditApiKey = (provider: AIProvider) => {
    setEditingProvider(provider.id);
    setApiKeyInput("");
  };

  const handleSaveApiKey = () => {
    if (editingProvider && apiKeyInput.trim()) {
      setProviders((prev) =>
        prev.map((p) =>
          p.id === editingProvider
            ? { ...p, apiKey: apiKeyInput.trim() }
            : p
        )
      );
      setEditingProvider(null);
      setApiKeyInput("");
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 1000);
    }
  };

  const handleCancelEdit = () => {
    setEditingProvider(null);
    setApiKeyInput("");
  };

  const maskedKey = (key: string) => {
    if (key.startsWith("sk-") || key.startsWith("sk-ant-")) {
      return key.slice(0, 8) + "••••••••••••••••••••••••••••••••";
    }
    return "••••••••••••••••••••••••••••••••••••";
  };

  const healthyCount = providers.filter((p) => p.healthStatus === "healthy").length;
  const enabledCount = providers.filter((p) => p.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Configuration</h1>
          <p className="text-white/60 mt-1">
            Manage AI providers, API keys, and priority settings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <p className="text-xs text-white/40">
              Last saved: {lastSaved.toLocaleTimeString()}
            </p>
          )}
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Check Health
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Active Providers</p>
                <p className="text-2xl font-bold text-white">
                  {enabledCount}/{providers.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#0066ff]/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#0066ff]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Healthy Services</p>
                <p className="text-2xl font-bold text-green-400">
                  {healthyCount}/{providers.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Total API Calls</p>
                <p className="text-2xl font-bold text-white">1.2M</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#00d4ff]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Providers List */}
      <div className="space-y-4">
        {providers
          .sort((a, b) => a.priority - b.priority)
          .map((provider) => {
            const Icon = provider.icon;
            const isEditing = editingProvider === provider.id;

            return (
              <Card
                key={provider.id}
                className={`transition-all ${
                  provider.enabled ? "hover:border-white/10" : "opacity-60"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Provider Info */}
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${provider.color}20` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: provider.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">
                            {provider.displayName}
                          </h3>
                          <Badge variant={getHealthBadgeVariant(provider.healthStatus)}>
                            <span className="flex items-center gap-1">
                              {getHealthIcon(provider.healthStatus)}
                              {provider.healthStatus.charAt(0).toUpperCase() +
                                provider.healthStatus.slice(1)}
                            </span>
                          </Badge>
                          {!provider.enabled && (
                            <Badge variant="outline">Disabled</Badge>
                          )}
                        </div>
                        <p className="text-sm text-white/60 mt-1">
                          {provider.healthMessage}
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                          Last checked:{" "}
                          {provider.lastChecked.toLocaleTimeString()}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs text-white/40">Models:</span>
                          {provider.models.slice(0, 3).map((model) => (
                            <Badge key={model} variant="outline" className="text-xs">
                              {model}
                            </Badge>
                          ))}
                          {provider.models.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{provider.models.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                      {/* Priority */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handlePriorityChange(provider.id, "up")}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-white/60 w-6 text-center">
                          {provider.priority}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handlePriorityChange(provider.id, "down")}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Enable/Disable */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40">Enable</span>
                        <Switch
                          checked={provider.enabled}
                          onCheckedChange={() => handleToggleEnabled(provider.id)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* API Key Section */}
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Key className="w-4 h-4 text-white/40" />
                        <span className="text-sm text-white/60">API Key:</span>
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              type="password"
                              placeholder="Enter new API key"
                              value={apiKeyInput}
                              onChange={(e) => setApiKeyInput(e.target.value)}
                              className="max-w-md font-mono"
                            />
                            <Button
                              size="sm"
                              onClick={handleSaveApiKey}
                              isLoading={isSaving}
                              disabled={!apiKeyInput.trim()}
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <code className="text-sm font-mono text-white/80 bg-white/5 px-3 py-1 rounded">
                            {showApiKey === provider.id
                              ? provider.apiKey
                              : maskedKey(provider.apiKey)}
                          </code>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditing ? null : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                setShowApiKey(
                                  showApiKey === provider.id ? null : provider.id
                                )
                              }
                            >
                              {showApiKey === provider.id ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditApiKey(provider)}
                            >
                              Update Key
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
