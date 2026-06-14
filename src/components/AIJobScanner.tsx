import React, { useState, useEffect } from "react";
import { Search, Sparkles, Loader2, ListCollapse, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Job, WorkType } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AIJobScannerProps {
  currentQuery: string;
  currentLocation: string;
  currentWorkType: string;
  onScanComplete: (newJobs: Job[]) => void;
}

const PROGRESS_STAGES = [
  "Contacting Google AI Studio server-side Gemini 3.5-flash network...",
  "Powering on real-time Google Search grounding tools...",
  "Drafting dynamic web queries for active Indian hiring boards...",
  "Scanning LinkedIn, Naukri India, glassdoor and corporate portals...",
  "Segregating locations specifically for Kochi, Bangalore and metro cities...",
  "Isolating remote boundaries, hybrid schedules, and salary benchmarks in INR...",
  "Compiling results into validated type-safe datasets..."
];

export default function AIJobScanner({
  currentQuery,
  currentLocation,
  currentWorkType,
  onScanComplete
}: AIJobScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [resultsCount, setResultsCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (scanning) {
      interval = setInterval(() => {
        setStageIndex((prev) => {
          if (prev < PROGRESS_STAGES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 2500); // Progress through stages every 2.5 seconds
    } else {
      setStageIndex(0);
    }
    return () => clearInterval(interval);
  }, [scanning]);

  const handleScan = async () => {
    setScanning(true);
    setErrorMsg(null);
    setResultsCount(null);
    setStageIndex(0);

    try {
      const response = await fetch("/api/jobs/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: currentQuery,
          location: currentLocation,
          workType: currentWorkType
        })
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.jobs)) {
        if (data.jobs.length > 0) {
          setResultsCount(data.jobs.length);
          onScanComplete(data.jobs);
        } else {
          setErrorMsg("Could not find any new matching jobs during live search. Try widening your keywords.");
        }
      } else {
        // If success is false, there might be an error message (like missing API key)
        setErrorMsg(data.error || "Failed to parse active web listings. Using curated listings.");
      }
    } catch (err: any) {
      setErrorMsg(`Connection error to scanner: ${err.message || err}`);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div id="ai-job-scanner-container" className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background radial accent */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-indigo-500/25">
              Powered by Google Search Grounding
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <h2 className="text-lg font-bold font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            Vivid AI Live Scanner
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Bypass stale database crawls. Instruct Gemini to search the live web for active AI/ML, computer vision, and NLP positions in your filtered target cities.
          </p>
        </div>

        <button
          id="initiate-ai-scan-button"
          onClick={handleScan}
          disabled={scanning}
          className="bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/15 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shrink-0 self-start md:self-center"
        >
          {scanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Scanning Web...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Deep-Scan Live Boards</span>
            </>
          )}
        </button>
      </div>

      {/* Selected Filters Summary Display */}
      <div className="mb-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex flex-wrap gap-2 text-xs">
        <span className="text-slate-500">Filters aimed:</span>
        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
          City: <strong className="text-white">{currentLocation}</strong>
        </span>
        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
          Work: <strong className="text-white">{currentWorkType}</strong>
        </span>
        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
          Keyword: <strong className="text-white">{currentQuery || "AI/ML General"}</strong>
        </span>
      </div>

      <AnimatePresence mode="wait">
        {scanning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
                  Active Crawler Pipeline
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Phase {stageIndex + 1} of {PROGRESS_STAGES.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                <motion.div
                  className="bg-indigo-500 h-full rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((stageIndex + 1) / PROGRESS_STAGES.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Current Stage text */}
              <motion.p
                key={stageIndex}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-mono text-slate-300 flex items-center gap-2"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 shrink-0" />
                {PROGRESS_STAGES[stageIndex]}
              </motion.p>
            </div>
          </motion.div>
        )}

        {!scanning && resultsCount !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-indigo-950/40 border border-indigo-500/20 text-indigo-200 rounded-xl flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h4 className="font-bold text-white mb-1">Live Search Success</h4>
              <p>
                Successfully crawled and segregated <span className="font-bold text-emerald-400">{resultsCount} real-time active positions</span> on top board targets. They have been injected into the lists below, tagged with a shiny purple <span className="font-bold text-indigo-400">AI Live Search</span> badge!
              </p>
            </div>
          </motion.div>
        )}

        {!scanning && errorMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-rose-950/30 border border-rose-500/20 text-rose-200 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-rose-450 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h4 className="font-semibold text-rose-300 mb-1">Search Notice</h4>
              <p className="mb-2 leading-relaxed">{errorMsg}</p>
              {errorMsg.toLowerCase().includes("api key") && (
                <div className="mt-2.5 p-2.5 bg-slate-950/70 rounded-lg text-slate-400 flex items-start gap-2">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    To activate real-time web crawlers, add your Google Gemini Key under the <strong className="text-white">Settings &gt; Secrets</strong> pane at the top-right of your AI Studio UI. For now, you can fully explore the high-fidelity pre-loaded database!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
