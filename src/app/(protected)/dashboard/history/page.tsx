"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Type,
  Code2,
  Image,
  Music,
  Video,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Coins,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type GenerationType = "all" | "text" | "code" | "image" | "music" | "video";
type StatusType = "all" | "completed" | "failed" | "pending";

interface HistoryEntry {
  id: string;
  type: Exclude<GenerationType, "all">;
  prompt: string;
  model: string;
  status: StatusType;
  date: string;
  creditsUsed: number;
  result?: string;
}

const mockHistory: HistoryEntry[] = [
  {
    id: "1",
    type: "text",
    prompt: "Write a blog post about the future of AI in healthcare",
    model: "GPT-4o",
    status: "completed",
    date: "2024-01-15 14:30",
    creditsUsed: 5,
    result: "Generated blog post with 5 sections covering diagnostics, treatment planning, and drug discovery...",
  },
  {
    id: "2",
    type: "image",
    prompt: "Futuristic cityscape with flying cars at sunset",
    model: "DALL-E 3",
    status: "completed",
    date: "2024-01-15 12:15",
    creditsUsed: 10,
    result: "https://picsum.photos/1024/1024?random=10",
  },
  {
    id: "3",
    type: "code",
    prompt: "Create a React component for a dark mode toggle switch",
    model: "Claude 3 Opus",
    status: "completed",
    date: "2024-01-14 18:45",
    creditsUsed: 3,
    result: "A fully accessible dark mode toggle with smooth transitions and system preference detection...",
  },
  {
    id: "4",
    type: "music",
    prompt: "Upbeat lo-fi track for studying with piano and rain sounds",
    model: "Suno AI",
    status: "completed",
    date: "2024-01-14 16:20",
    creditsUsed: 15,
    result: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "5",
    type: "video",
    prompt: "Aerial view of mountains with clouds moving dramatically",
    model: "Sora 1.0",
    status: "pending",
    date: "2024-01-14 10:00",
    creditsUsed: 25,
  },
  {
    id: "6",
    type: "text",
    prompt: "Summarize the key points of quantum computing for beginners",
    model: "Claude 3 Sonnet",
    status: "completed",
    date: "2024-01-13 22:30",
    creditsUsed: 2,
    result: "Quantum computing uses quantum mechanics to process information differently than classical computers...",
  },
  {
    id: "7",
    type: "image",
    prompt: "Abstract art with flowing colors and geometric shapes",
    model: "Midjourney V6",
    status: "failed",
    date: "2024-01-13 15:00",
    creditsUsed: 0,
  },
  {
    id: "8",
    type: "code",
    prompt: "Python function to parse JSON with error handling",
    model: "GPT-4 Turbo",
    status: "completed",
    date: "2024-01-13 11:45",
    creditsUsed: 2,
    result: "def parse_json_with_error_handling(json_string):\n    try:\n        return json.loads(json_string)\n    except json.JSONDecodeError as e:\n        return {\"error\": str(e)}",
  },
];

const typeIcons: Record<string, any> = {
  text: Type,
  code: Code2,
  image: Image,
  music: Music,
  video: Video,
};

const typeColors: Record<string, string> = {
  text: "text-blue-400 bg-blue-400/10",
  code: "text-purple-400 bg-purple-400/10",
  image: "text-orange-400 bg-orange-400/10",
  music: "text-green-400 bg-green-400/10",
  video: "text-[#00d4ff] bg-[#00d4ff]/10",
};

const statusIcons: Record<string, any> = {
  completed: CheckCircle2,
  failed: XCircle,
  pending: Loader2,
};

const statusColors: Record<string, string> = {
  completed: "text-green-400 bg-green-400/10",
  failed: "text-red-400 bg-red-400/10",
  pending: "text-yellow-400 bg-yellow-400/10",
};

export default function HistoryPage() {
  const [typeFilter, setTypeFilter] = useState<GenerationType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredHistory = mockHistory.filter((entry) => {
    const matchesType = typeFilter === "all" || entry.type === typeFilter;
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      entry.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const handleViewDetails = (entry: HistoryEntry) => {
    setSelectedEntry(entry);
    setIsDialogOpen(true);
  };

  const handleRetry = (entry: HistoryEntry) => {
    // Navigate to appropriate generation page
    window.location.href = `/dashboard/${entry.type}`;
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
            <History className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Generation History</h1>
            <p className="text-sm text-white/60">View and manage your past generations</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            placeholder="Search by prompt or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex gap-3">
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as GenerationType)}
          >
            <SelectTrigger className="w-[140px] bg-white/5 border-white/10">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0a0f] border-white/10">
              <SelectItem value="all" className="focus:bg-white/10">All Types</SelectItem>
              <SelectItem value="text" className="focus:bg-white/10">Text</SelectItem>
              <SelectItem value="code" className="focus:bg-white/10">Code</SelectItem>
              <SelectItem value="image" className="focus:bg-white/10">Image</SelectItem>
              <SelectItem value="music" className="focus:bg-white/10">Music</SelectItem>
              <SelectItem value="video" className="focus:bg-white/10">Video</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusType)}
          >
            <SelectTrigger className="w-[140px] bg-white/5 border-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0a0f] border-white/10">
              <SelectItem value="all" className="focus:bg-white/10">All Status</SelectItem>
              <SelectItem value="completed" className="focus:bg-white/10">Completed</SelectItem>
              <SelectItem value="failed" className="focus:bg-white/10">Failed</SelectItem>
              <SelectItem value="pending" className="focus:bg-white/10">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* History List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <AnimatePresence mode="popLayout">
          {filteredHistory.map((entry, index) => {
            const Icon = typeIcons[entry.type];
            const StatusIcon = statusIcons[entry.status];
            const typeColorClass = typeColors[entry.type];
            const statusColorClass = statusColors[entry.status];

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-xl border border-white/5 bg-white/5 p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div
                    className={cn(
                      "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
                      typeColorClass
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-white truncate pr-4">
                        {entry.prompt}
                      </p>
                      <Badge
                        className={cn(
                          "flex-shrink-0 text-xs",
                          statusColorClass
                        )}
                      >
                        <StatusIcon
                          className={cn(
                            "mr-1 h-3 w-3",
                            entry.status === "pending" && "animate-spin"
                          )}
                        />
                        {entry.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        {entry.creditsUsed} credits
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {entry.date}
                      </span>
                      <span className="rounded bg-white/10 px-2 py-0.5">
                        {entry.model}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDetails(entry)}
                      className="h-8 w-8"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {entry.status === "failed" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRetry(entry)}
                        className="h-8 w-8"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredHistory.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <History className="h-16 w-16 text-white/20 mb-4" />
            <h3 className="text-lg font-medium text-white/70">No history found</h3>
            <p className="mt-1 text-sm text-white/40">
              {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Start generating content to see your history here"}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#0a0a0f] border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEntry && (
                <>
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      typeColors[selectedEntry.type]
                    )}
                  >
                    {React.createElement(typeIcons[selectedEntry.type], {
                      className: "h-4 w-4",
                    })}
                  </div>
                  Generation Details
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              View the full details of this generation
            </DialogDescription>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wide">
                  Prompt
                </label>
                <p className="mt-1 text-sm text-white">{selectedEntry.prompt}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wide">
                    Model
                  </label>
                  <p className="mt-1 text-sm text-white">{selectedEntry.model}</p>
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wide">
                    Status
                  </label>
                  <p className="mt-1 text-sm text-white capitalize">
                    {selectedEntry.status}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wide">
                    Credits Used
                  </label>
                  <p className="mt-1 text-sm text-white">
                    {selectedEntry.creditsUsed}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wide">
                    Date
                  </label>
                  <p className="mt-1 text-sm text-white">{selectedEntry.date}</p>
                </div>
              </div>

              {selectedEntry.result && (
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wide">
                    Result
                  </label>
                  {selectedEntry.type === "image" ? (
                    <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
                      <img
                        src={selectedEntry.result}
                        alt="Generated"
                        className="max-w-full h-auto"
                      />
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-white/80 whitespace-pre-wrap">
                      {selectedEntry.result}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleRetry(selectedEntry);
                    setIsDialogOpen(false);
                  }}
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
