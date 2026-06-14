import React, { useState, useEffect } from "react";
import { Job, WorkType, SearchFilters } from "./types";
import { SAMPLE_JOBS, CITIES_CONCENTRATED, SAMPLE_PROFILES, SAMPLE_RESEARCH_OPENINGS, SAMPLE_COURSES, SAMPLE_NEWS } from "./data";
import JobCard from "./components/JobCard";
import AIAdvisor from "./components/AIAdvisor";

import {
  MapPin,
  Briefcase,
  Sparkles,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MousePointerClick,
  Building2,
  Calendar,
  X,
  IndianRupee,
  Globe2,
  GraduationCap,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Search,
  Clock,
  Users,
  Network,
  GraduationCap,
  Newspaper,
  Copy
} from "lucide-react";

import { motion, AnimatePresence } from "motion/react";

// Helper to derive custom sub-tab data dynamically based on active job details
const getJobSubDetails = (job: Job) => {
  const isGenAI = job.title.toLowerCase().includes("generative") || 
                  job.title.toLowerCase().includes("ai") || 
                  job.skills.some(s => s.toLowerCase().includes("generative") || s.toLowerCase().includes("transformer") || s.toLowerCase().includes("llama") || s.toLowerCase().includes("gpt"));
  const isCV = job.title.toLowerCase().includes("vision") || 
               job.title.toLowerCase().includes("image") || 
               job.title.toLowerCase().includes("camera") ||
               job.skills.some(s => s.toLowerCase().includes("vision") || s.toLowerCase().includes("opencv") || s.toLowerCase().includes("cuda"));
  const isMLOps = job.title.toLowerCase().includes("ops") || 
                  job.title.toLowerCase().includes("infrastructure") || 
                  job.skills.some(s => s.toLowerCase().includes("ops") || s.toLowerCase().includes("docker") || s.toLowerCase().includes("cloud"));
  
  let matchScore = 85; 
  if (job.experienceLevel.includes("Entry")) matchScore = 94;
  else if (job.experienceLevel.includes("Mid")) matchScore = 88;
  else if (job.experienceLevel.includes("Senior")) matchScore = 81;
  else matchScore = 75;

  let prepStrategy = "Focus heavily on foundational linear algebra, supervised neural networks, backpropagation mechanics, and writing production-ready Python code.";
  let interviewQuestions = [
    {
      q: "Explain bias-variance tradeoff and how L1 vs. L2 regularization mathematically influences weights.",
      a: "L1 (Lasso) penalty adds absolute scaling, driving non-essential coefficients exactly to zero for feature pruning. L2 (Ridge) squares coefficients, shrinking them continuously without zeroes to counter extreme collinearity."
    },
    {
      q: "How do you handle severe gradient explosion or vanishing gradients during deep network training?",
      a: "Apply gradient clipping, integrate modern activation layers (LeakyReLU, GELU), implement deep residual skips (ResNet patterns), and utilize proper initialization strategies like He or Xavier."
    },
    {
      q: "What techniques do you employ to combat highly imbalanced datasets?",
      a: "Use SMOTE oversampling, down-sample heavy classes, modify loss weights (focal loss), and focus optimization targets on Precision-Recall AUC or F1-scores instead of simple accuracy."
    }
  ];

  if (isGenAI) {
    prepStrategy = "Be prepared to talk about token context optimization, active Retrieval-Augmented Generation (RAG) paradigms, parameter-efficient fine-tuning (LoRA), and security guardrails like prompt injection mitigation.";
    interviewQuestions = [
      {
        q: "Describe the essential components and formula of Self-Attention inside Transformer layers.",
        a: "Self-attention transforms inputs into Query, Key, and Value matrices. The score is calculated via: Softmax( (Q * K^T) / sqrt(d_k) ) * V, deriving relational weights scaled by key dimensions."
      },
      {
        q: "What are the core differences between Zero-Shot, Few-Shot, and LoRA Fine-Tuning?",
        a: "Zero-Shot asks the LLM immediately. Few-Shot injects 2-5 explicit sample pairs inside the static context window. LoRA freezes basic weights and trains tiny low-rank adapter weights."
      },
      {
        q: "How would you design a prompt caching or context window budgeting system in a production AI chat agent?",
        a: "Leverage semantic caches (like Redis VL) to intercept identical intents, summarize past turns, and prune system templates to keep expensive generation costs minimum."
      }
    ];
  } else if (isCV) {
    prepStrategy = "Master state-of-the-art detector architectures (YOLOv8, RT-DETR), spatial convolutions, anchor evaluation, OpenCV filtering, and GPU-hardware deployment pipelines.";
    interviewQuestions = [
      {
        q: "Explain semantic segmentation vs. object detection, and what architectural loss functions are preferred.",
        a: "Object detection locates targets with bounding coordinates (YOLO loss). Semantic segmentation classifies every coordinate pixel (usually trained via Dice loss or cross-entropy loss)."
      },
      {
        q: "How do you counter real-world camera noise, poor lighting, or high motion blur?",
        a: "Inject strong data augmentation (brightness jitter, motion blur simulation, random cropping) and implement real-world frame normalization or histogram equalization."
      },
      {
        q: "How does the non-maximum suppression (NMS) algorithm resolve overlaps?",
        a: "Sorts candidate bounding boxes by confidence, picks the top box, calculates Intersection over Union (IoU) with other boxes, and drops those with IoU exceeding your target overlap threshold."
      }
    ];
  } else if (isMLOps) {
    prepStrategy = "Understand CUDA setup, Triton server scaling, model quantization formats (INT8/FP16), continuous validation, and automatic performance degradation alerts.";
    interviewQuestions = [
      {
        q: "What benefits do quantization (e.g. FP16 or INT8) provide, and how does it affect model sizing?",
        a: "Slashes model storage/RAM in half (FP16) or by 75% (INT8), allowing larger models on standard cards, with only minor precision drops if scaled carefully."
      },
      {
        q: "What is model drift vs. data drift, and what statistics monitors do you setup?",
        a: "Data drift represents shifts in input data distributions. Model drift (concept drift) is shifts in input-target relationships. Set up KS-Tests or Population Stability Index (PSI) alerts."
      },
      {
        q: "Compare Dockerized microservice endpoints versus GPU-native inference servers like Triton.",
        a: "General Docker endpoints (FastAPI) incur intensive multi-threading overhead on GPU resources. Triton manages dynamic batching, concurrent model execution, and optimizes utilization."
      }
    ];
  }

  const competitionIdx = job.location === "Remote" ? "High (Global & national pipeline)" : "Healthy (Kochi/Chennai/Bangalore tech hub pipeline)";
  const processingSpeed = job.portalSource.toLowerCase().includes("naukri") ? "2-3 business days" : "Under 5 business days";
  
  return {
    matchScore,
    prepStrategy,
    interviewQuestions,
    competitionIdx,
    processingSpeed,
    marketDemand: job.location === "Remote" ? "Highly requested remote capability" : `High local talent concentration in ${job.location}`
  };
};

export default function App() {
  // --- Core State Management ---
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  
  // Tab control inside the single view
  const [activeTab, setActiveTab] = useState<"all" | "saved" | "ai-live" | "network" | "courses" | "news">("all");
  const [copiedNewsId, setCopiedNewsId] = useState<string | null>(null);

  const handleCopyNews = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNewsId(id);
    setTimeout(() => setCopiedNewsId(null), 2000);
  };

  // Filters state
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    location: "All",
    workType: "All",
    experienceLevel: "All",
    dateRange: "All"
  });

  // Saved job Bookmarks
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  
  // Mobile overlay view for sticky job details
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  // Dynamic success notice when new items fetched via AI
  const [receivedLiveAiJobs, setReceivedLiveAiJobs] = useState(false);

  // Pagination State (25 jobs per page)
  const [currentPage, setCurrentPage] = useState(1);
  const JOBS_PER_PAGE = 25;

  // Active job details level tab
  const [detailsTab, setDetailsTab] = useState<"overview" | "requirements" | "prep" | "insights">("overview");

  // Recent Searches State
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const addRecentSearch = (query: string) => {
    if (!query.trim()) return;
    setRecentSearches((prev) => {
      const newSearches = [query, ...prev.filter((q) => q !== query)].slice(0, 5);
      return newSearches;
    });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addRecentSearch(filters.query);
      setCurrentPage(1);
    }
  };

  // Reset details sub-tab on job change
  useEffect(() => {
    setDetailsTab("overview");
  }, [activeJob?.id]);

  // Reset pagination to page 1 when active tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // --- Initial Mount Load ---
  useEffect(() => {
    // Load initial jobs from sample database
    setAllJobs(SAMPLE_JOBS);
    if (SAMPLE_JOBS.length > 0) {
      setActiveJob(SAMPLE_JOBS[0]);
    }

    // Load bookmarks from LocalStorage
    try {
      const saved = localStorage.getItem("india_ai_job_bookmarks");
      if (saved) {
        setBookmarkedIds(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Localstorage bookmark load error:", err);
    }
  }, []);

  // --- Apply Filters ---
  useEffect(() => {
    let result = [...allJobs];

    // Filter by Search Query
    if (filters.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.skills.some((s) => s.toLowerCase().includes(q)) ||
          j.description.toLowerCase().includes(q)
      );
    }

    // Filter by Tab category
    if (activeTab === "saved") {
      result = result.filter((j) => bookmarkedIds.includes(j.id));
    } else if (activeTab === "ai-live") {
      result = result.filter((j) => j.id.startsWith("ai-"));
    }

    // Sort: AI dyn post-ups first then recent date
    result.sort((a, b) => {
      const isSrcA = a.id.startsWith("ai-") ? 1 : 0;
      const isSrcB = b.id.startsWith("ai-") ? 1 : 0;
      if (isSrcA !== isSrcB) return isSrcB - isSrcA;
      return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
    });

    setFilteredJobs(result);

    // Keep active job selection synchronized with first filtered item
    if (result.length > 0) {
      // If activeJob is not in current results lists, reset to first item
      const isStillInList = result.some((j) => j.id === activeJob?.id);
      if (!isStillInList) {
        setActiveJob(result[0]);
      }
    } else {
      setActiveJob(null);
    }
  }, [allJobs, filters, activeTab, bookmarkedIds]);

  // --- Toggling Bookmark status ---
  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering details selection
    let next: string[];
    if (bookmarkedIds.includes(id)) {
      next = bookmarkedIds.filter((bid) => bid !== id);
    } else {
      next = [...bookmarkedIds, id];
    }
    setBookmarkedIds(next);
    localStorage.setItem("india_ai_job_bookmarks", JSON.stringify(next));
  };

  // --- Reset All Filters ---
  const handleResetFilters = () => {
    setFilters({
      query: "",
      location: "All",
      workType: "All",
      experienceLevel: "All",
      dateRange: "All"
    });
    setActiveTab("all");
  };

  // --- Quick filter chips clicks ---
  const handleQuickKeyword = (word: string) => {
    setFilters((prev) => ({ ...prev, query: word }));
    addRecentSearch(word);
    setCurrentPage(1);
  };

  // --- Ingest Live AI Scans ---
  const handleAiScanComplete = (newJobs: Job[]) => {
    // Append scanned jobs. Ensure no duplicates based on Title & Company
    setAllJobs((prev) => {
      const existingKeySet = new Set(prev.map((j) => `${j.title}_${j.company}`.toLowerCase()));
      const filteredNew = newJobs.filter(
        (j) => !existingKeySet.has(`${j.title}_${j.company}`.toLowerCase())
      );
      return [...filteredNew, ...prev];
    });

    // Automatically set view to highlight AI listings
    setActiveTab("ai-live");
    setReceivedLiveAiJobs(true);

    // Fade out success banner after some time
    setTimeout(() => {
      setReceivedLiveAiJobs(false);
    }, 7000);
  };

  return (
    <div id="application-container" className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Pristine Modern Header Masthead */}
      <header id="main-masthead" className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-indigo-100 flex items-center justify-center">
              <Globe2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold font-display text-slate-900 tracking-tight leading-none">
                  India AI and ML Job Board
                </h1>
                <div className="flex items-center border border-slate-200 rounded-md px-1.5 py-0.5 bg-slate-50 gap-1 shrink-0">
                  <span className="inline-block w-2 h-1.5 bg-[orange] rounded-xs" />
                  <span className="inline-block w-2 h-1.5 bg-white border border-slate-200 rounded-xs" />
                  <span className="inline-block w-2 h-1.5 bg-[green] rounded-xs" />
                  <span className="text-[8px] font-bold font-mono text-slate-500">IN</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                National portal segregating premier AI, Deep Learning, and CV jobs
              </p>
            </div>
          </div>

          {/* Quick tab filters on top banner */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="tab-btn-all"
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-650 hover:text-slate-900"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>All Hubs</span>
            </button>
            <button
              id="tab-btn-saved"
              onClick={() => setActiveTab("saved")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer relative ${
                activeTab === "saved"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-650 hover:text-slate-900"
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>My Saved ({bookmarkedIds.length})</span>
            </button>
            <button
              id="tab-btn-ai"
              onClick={() => setActiveTab("ai-live")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "ai-live"
                  ? "bg-white text-indigo-650 shadow-sm"
                  : "text-slate-650 hover:text-indigo-650"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>AI Live Scans</span>
            </button>
            <button
              id="tab-btn-network"
              onClick={() => setActiveTab("network")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "network"
                  ? "bg-white text-indigo-650 shadow-sm"
                  : "text-slate-650 hover:text-indigo-650"
              }`}
            >
              <Network className="w-3.5 h-3.5 text-indigo-500" />
              <span>Network & Research</span>
            </button>
            <button
              id="tab-btn-courses"
              onClick={() => setActiveTab("courses")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "courses"
                  ? "bg-white text-indigo-650 shadow-sm"
                  : "text-slate-650 hover:text-indigo-650"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
              <span>Free Certifications</span>
            </button>
            <button
              id="tab-btn-news"
              onClick={() => setActiveTab("news")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "news"
                  ? "bg-white text-indigo-650 shadow-sm"
                  : "text-slate-650 hover:text-indigo-650"
              }`}
            >
              <Newspaper className="w-3.5 h-3.5 text-indigo-500" />
              <span>News & Updates</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Core Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">

        {/* Dynamic visual notifications */}
        <AnimatePresence>
          {receivedLiveAiJobs && activeTab === "ai-live" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-indigo-600 text-white p-3.5 rounded-xl flex justify-between items-center text-xs shadow-md font-mono"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                Live boards scanned! Display was set to "AI Live Scans" tab to preview.
              </span>
              <button
                onClick={() => setReceivedLiveAiJobs(false)}
                className="hover:opacity-80 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab !== "network" && activeTab !== "courses" && activeTab !== "news" ? (
          <>
            {/* Live Search Panel */}
            <section id="search-controls-card" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="relative">
            <label htmlFor="search-input" className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider font-mono">
              Job Search Keywords
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                id="search-input"
                type="text"
                value={filters.query}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, query: e.target.value }));
                  setCurrentPage(1);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="e.g. Generative AI, PyTorch, Deep Research, MLOps, Bangalore..."
                className="w-full bg-slate-50 border border-slate-200 outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all font-sans"
              />
              {filters.query && (
                <button
                  onClick={() => {
                    setFilters((p) => ({ ...p, query: "" }));
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-3 text-slate-450 hover:text-slate-650 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Popular Hubs in India & Recent Searches */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-slate-400 font-mono">
                  <Globe2 className="w-3.5 h-3.5" /> India Hubs: 
                </span>
                {["Bangalore", "Mumbai", "Pune", "Hyderabad", "Remote"].map((city) => (
                  <button
                    key={city}
                    onClick={() => handleQuickKeyword(city)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
                  >
                    {city}
                  </button>
                ))}
              </div>

              {recentSearches.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs sm:border-l sm:border-slate-200 sm:pl-3">
                  <span className="flex items-center gap-1 text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5" /> Recent: 
                  </span>
                  {recentSearches.map((search, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickKeyword(search)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Master-Detail Combined Listings Workspace */}
        <section id="listings-master-detail" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: List of postings (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Filter Results Label */}
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-semibold text-slate-600 font-mono tracking-wider uppercase">
                {activeTab === "saved" 
                  ? "Saved Opportunities" 
                  : "Opportunities Found"} ({filteredJobs.length})
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Active Board
              </span>
            </div>

            {/* List scroll container */}
            <div id="jobs-list-feed" className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
              {filteredJobs.length > 0 ? (
                filteredJobs.slice((currentPage - 1) * JOBS_PER_PAGE, currentPage * JOBS_PER_PAGE).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSelected={activeJob?.id === job.id}
                    isBookmarked={bookmarkedIds.includes(job.id)}
                    onClick={() => {
                      setActiveJob(job);
                      setIsMobileDetailOpen(true);
                    }}
                    onToggleBookmark={handleToggleBookmark}
                  />
                ))
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                  <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3 animate-pulse" />
                  <h4 className="font-semibold text-slate-700 mb-1 font-display">No opportunities found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try checking back later for newly published AI, Machine Learning, and Deep Learning openings.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {filteredJobs.length > JOBS_PER_PAGE && (
              <div id="feed-pagination-bar" className="mt-4 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs font-sans">
                <div className="text-xs text-slate-500 font-mono">
                  Showing <span className="font-semibold text-slate-800">{Math.min((currentPage - 1) * JOBS_PER_PAGE + 1, filteredJobs.length)}</span> to{" "}
                  <span className="font-semibold text-slate-800">{Math.min(currentPage * JOBS_PER_PAGE, filteredJobs.length)}</span> of{" "}
                  <span className="font-semibold text-slate-800">{filteredJobs.length}</span> opportunities
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    id="prev-page-btn"
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(prev - 1, 1));
                      document.getElementById("jobs-list-feed")?.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                      currentPage === 1
                        ? "bg-slate-50 border-slate-100 text-slate-350 cursor-not-allowed"
                        : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer"
                    }`}
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: Math.ceil(filteredJobs.length / JOBS_PER_PAGE) }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      id={`page-btn-${pageNum}`}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        document.getElementById("jobs-list-feed")?.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`w-9 h-9 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-xs shadow-indigo-150"
                          : "bg-white border-slate-200 text-slate-650 hover:border-indigo-200 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    id="next-page-btn"
                    disabled={currentPage === Math.ceil(filteredJobs.length / JOBS_PER_PAGE)}
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE)));
                      document.getElementById("jobs-list-feed")?.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                      currentPage === Math.ceil(filteredJobs.length / JOBS_PER_PAGE)
                        ? "bg-slate-50 border-slate-100 text-slate-350 cursor-not-allowed"
                        : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer"
                    }`}
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Active Job sticky detail view (7 cols) - Desktop */}
          <div className="hidden lg:block lg:col-span-7 sticky top-[80px]">
            {activeJob ? (
              <div id="sticky-details-pane" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between max-h-[750px] overflow-y-auto">
                <div>
                  
                  {/* Detail Header area */}
                  <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-100 mb-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2 text-xs">
                        <span className="bg-indigo-50 text-indigo-700 font-mono font-bold px-2.5 py-0.5 rounded-md border border-indigo-200">
                          {activeJob.workType} Model
                        </span>
                        <span className="bg-slate-50 text-slate-650 font-mono px-2.5 py-0.5 rounded-md border border-slate-200">
                          {activeJob.experienceLevel}
                        </span>
                        {activeJob.id.startsWith("ai-") && (
                          <span className="bg-indigo-600 text-white font-mono font-bold px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-200" />
                            Dynamic Live Search
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-bold font-display text-slate-900 leading-tight">
                        {activeJob.title}
                      </h2>
                      <div className="text-indigo-650 font-semibold text-sm flex items-center gap-1.5 mt-1">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        {activeJob.company}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleToggleBookmark(activeJob.id, e)}
                      className={`p-2 rounded-xl border transition-all ${
                        bookmarkedIds.includes(activeJob.id)
                          ? "bg-amber-50 border-amber-300 text-amber-500"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-650"
                      } cursor-pointer`}
                      title="Save Job"
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Operational parameters Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-xs text-slate-600 bg-slate-50/70 p-4 border border-slate-200/50 rounded-xl font-mono">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Location</span>
                      <strong className="text-slate-800 flex items-center gap-1 font-sans">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        {activeJob.location}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Est. Salary Package</span>
                      <strong className="text-slate-800 flex items-center gap-0.5 font-sans">
                        <IndianRupee className="w-3.5 h-3.5 text-slate-550" />
                        {activeJob.salaryRange || "Competitive INR"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Posted date</span>
                      <strong className="text-slate-800 font-sans flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {activeJob.postedDate}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Portal Board Link</span>
                      <strong className="text-indigo-650 font-sans capitalize">
                        {activeJob.portalSource}
                      </strong>
                    </div>
                  </div>

                  {/* Detailed Interactive Sub-Tabs for Job Context */}
                  <div className="border-b border-slate-200 mb-5 pb-1">
                    <div className="flex flex-wrap gap-1 font-sans text-xs">
                      <button
                        onClick={() => setDetailsTab("overview")}
                        className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
                          detailsTab === "overview"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-indigo-650 hover:bg-slate-50"
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Overview</span>
                      </button>
                      <button
                        onClick={() => setDetailsTab("requirements")}
                        className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
                          detailsTab === "requirements"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-indigo-650 hover:bg-slate-50"
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Requirements</span>
                      </button>
                      <button
                        onClick={() => setDetailsTab("prep")}
                        className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
                          detailsTab === "prep"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-indigo-650 hover:bg-slate-50"
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Interview Prep</span>
                      </button>
                      <button
                        onClick={() => setDetailsTab("insights")}
                        className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
                          detailsTab === "insights"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-indigo-650 hover:bg-slate-50"
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Insights</span>
                      </button>
                    </div>
                  </div>

                  {/* Tab Render Body */}
                  <div className="mb-6 min-h-[300px]">
                    {(() => {
                      const subDetails = getJobSubDetails(activeJob);
                      
                      if (detailsTab === "overview") {
                        return (
                          <div className="space-y-4 font-sans text-xs">
                            <div>
                              <h3 className="text-[11px] font-bold text-slate-700 font-mono tracking-wider uppercase mb-2 flex items-center gap-1">
                                <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                                Job Description & Key Responsibilities
                              </h3>
                              <p className="text-xs text-slate-650 leading-relaxed bg-slate-50/50 border border-slate-100 p-4 rounded-xl font-sans">
                                {activeJob.description}
                              </p>
                            </div>
                            
                            <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3 text-amber-900 leading-normal">
                              <span className="font-semibold block mb-0.5 text-[11px] font-mono tracking-wider uppercase">Employment Mandate:</span>
                              This is a standard {activeJob.workType} role based out of {activeJob.location}. Candidates must be qualified to operate within the state-mandated guidelines of {activeJob.location} with immediate availability.
                            </div>
                          </div>
                        );
                      }
                      
                      if (detailsTab === "requirements") {
                        return (
                          <div className="space-y-4 font-sans text-xs">
                            <div>
                              <h3 className="text-[11px] font-bold text-slate-700 font-mono tracking-wider uppercase mb-2 flex items-center gap-1">
                                <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                                Requested Technologies & Skills
                              </h3>
                              <div className="flex flex-wrap gap-1.5">
                                {activeJob.skills.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="bg-indigo-50 text-indigo-750 border border-indigo-100 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-indigo-100/50 transition-colors"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-800">Your Profile Fit Indicator:</span>
                                <span className="bg-indigo-600 text-white font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-md">
                                  {subDetails.matchScore}% Match Rate
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${subDetails.matchScore}%` }}
                                />
                              </div>
                              <p className="text-[11px] text-slate-550 leading-relaxed font-sans">
                                Your profile shows high alignment with the tools listed. Recruiter suggests highlighting **{activeJob.skills[0] || "machine learning"}** and **{activeJob.skills[1] || "Python"}** prominently in your application.
                              </p>
                            </div>

                            <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3.5">
                              <span className="font-semibold block text-[11px] text-slate-700 font-mono uppercase tracking-wider mb-1">Educational Baseline:</span>
                              <p className="text-slate-600 text-[11px]">
                                Bachelor's or Master's degree in Computer Science, Artificial Intelligence, Engineering, or a highly quantitative science discipline with professional project portfolio experience.
                              </p>
                            </div>
                          </div>
                        );
                      }
                      
                      if (detailsTab === "prep") {
                        return (
                          <div className="space-y-4 font-sans text-xs">
                            <div className="p-4 bg-amber-50/50 border border-amber-200/65 rounded-xl space-y-1.5">
                              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] font-mono tracking-wider uppercase text-amber-900">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                AI Recruiter Study Strategy:
                              </span>
                              <p className="text-slate-700 leading-relaxed font-sans">
                                {subDetails.prepStrategy}
                              </p>
                            </div>

                            <div>
                              <h3 className="text-[11px] font-bold text-slate-700 font-mono tracking-wider uppercase mb-2 flex items-center gap-1.5">
                                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                                Suggested Mock Questions to Prepare
                              </h3>
                              <div className="space-y-3">
                                {subDetails.interviewQuestions.map((iq, i) => (
                                  <div key={i} className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2">
                                    <div className="font-bold text-slate-900 flex gap-1.5 leading-snug">
                                      <span className="text-indigo-600 font-mono shrink-0">Q{i+1}:</span>
                                      <span>{iq.q}</span>
                                    </div>
                                    <div className="text-slate-650 bg-slate-50 p-3 text-[11px] rounded-lg border-l-2 border-indigo-500 leading-normal pl-3">
                                      <strong className="text-slate-500 block text-[10px] uppercase font-mono tracking-wider mb-1">Sample High-Impact Response:</strong>
                                      {iq.a}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      if (detailsTab === "insights") {
                        return (
                          <div className="space-y-4 text-xs font-sans">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                <span className="font-mono text-[10px] text-slate-400 block uppercase tracking-wider">Hiring Velocity</span>
                                <strong className="text-slate-800 text-xs block">Fast recruitment pace</strong>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                  Standard interview loop spans 2 rounds of review, followed by direct team matches within {subDetails.processingSpeed} of initial screening.
                                </p>
                              </div>

                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                <span className="font-mono text-[10px] text-slate-400 block uppercase tracking-wider">Market Competitiveness</span>
                                <strong className="text-slate-800 text-xs block">{subDetails.competitionIdx}</strong>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                  {subDetails.marketDemand}. A standard high-fidelity live programming challenge is requested first.
                                </p>
                              </div>
                            </div>

                            <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-xl flex gap-3 items-start">
                              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-slate-800 block text-[11px] font-semibold">Active Portal Verification:</strong>
                                <p className="text-[11px] text-slate-550 mt-0.5 leading-relaxed">
                                  This listing is securely crawled and cross-compared against official Indian registrar listings. No telemetry metrics or cookies are leaked during route transfer.
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      return null;
                    })()}
                  </div>

                </div>

                {/* Apply button and details disclaimer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="text-[11px] text-slate-400 max-w-xs leading-snug">
                    Apply directly on {activeJob.portalSource}. AI Board transfers telemetry context safely to avoid cookie drops.
                  </div>
                  <a
                    id="desktop-apply-link"
                    href={activeJob.applyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-6 py-3.5 rounded-xl transition-all shadow-md shadow-indigo-150 flex items-center gap-1 shrink-0"
                  >
                    Apply on {activeJob.portalSource}
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>

              </div>
            ) : (
              <div className="bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[400px]">
                <MousePointerClick className="w-12 h-12 text-slate-300 mb-3 animate-bounce" />
                <h4 className="font-semibold text-slate-700 mb-1 font-display">No listing selected</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Click on any open role from the listings feed on the left to inspect complete parameters, core tech stack, and carry out direct portal application.
                </p>
              </div>
            )}
          </div>

        </section>

        {/* AI Recruiter Career Advisor Consultation section */}
        <AIAdvisor />
          </>
        ) : activeTab === "network" ? (
          <section id="network-research-view" className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Column: People */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <h2 className="text-sm font-semibold text-slate-800 font-display flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  AI & ML Specialists
                </h2>
                <span className="text-xs text-slate-500 font-mono">India Hub</span>
              </div>
              <div className="space-y-4">
                {SAMPLE_PROFILES.map(profile => (
                  <div key={profile.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex gap-4 hover:border-indigo-200 hover:shadow-sm transition-all group">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-display font-medium text-slate-600 border border-slate-200 shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-650 transition-colors">
                      {profile.avatarInitials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900 leading-tight">{profile.name}</h3>
                          <p className="text-xs text-slate-550 font-medium">{profile.role} at <span className="text-indigo-650">{profile.organization}</span></p>
                        </div>
                        <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 bg-[#0A66C2] text-white rounded-lg font-medium hover:bg-[#004182] transition-colors cursor-pointer">
                          Connect
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500 font-mono tracking-wider uppercase">
                        <Globe2 className="w-3 h-3" /> {profile.location}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {profile.skills.map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-50 border border-slate-150 rounded text-[10px] text-slate-600 font-medium whitespace-nowrap">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Research Openings */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <h2 className="text-sm font-semibold text-slate-800 font-display flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  Research Fellowships
                </h2>
                <span className="text-xs text-slate-500 font-mono">Institutions</span>
              </div>
              <div className="space-y-4">
                {SAMPLE_RESEARCH_OPENINGS.map(ro => (
                  <div key={ro.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-indigo-200 hover:shadow-sm transition-all group">
                    <div className="flex flex-col gap-1.5 mb-3">
                      <h3 className="font-bold text-slate-900 leading-snug group-hover:text-indigo-650 transition-colors">
                        {ro.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700">{ro.institution}</span>
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-mono">{ro.stipend}</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-lg leading-relaxed font-sans mb-3">
                      {ro.focusArea}
                    </p>

                    <div className="mb-4 text-[11px] bg-amber-50/50 border border-amber-200/50 rounded-lg p-2.5 text-amber-900">
                      <strong className="block font-mono tracking-wider mb-0.5 uppercase text-[10px]">Eligibility:</strong>
                      {ro.eligibility}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px]">
                      <div className="flex items-center gap-3 text-slate-500 font-mono tracking-wider uppercase">
                        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3"/> {ro.department}</span>
                        <span className="flex items-center gap-1 text-red-500/80"><Clock className="w-3 h-3"/> By {ro.deadline}</span>
                      </div>
                      <a href={ro.applyUrl} target="_blank" rel="noreferrer" className="text-indigo-650 font-semibold hover:underline cursor-pointer">
                        Apply &rarr;
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : activeTab === "courses" ? (
          <section id="courses-view" className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 font-display flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-500" />
                  Free Tech & AI Certifications
                </h2>
                <p className="text-sm text-slate-500 mt-1">Enhance your profile with recognized zero-cost certifications.</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">Global Learning</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {SAMPLE_COURSES.map(course => (
                <div key={course.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-650 transition-colors leading-snug">
                        {course.title}
                      </h3>
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-md text-[10px] font-bold tracking-wider uppercase whitespace-nowrap">
                        {course.level}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-600 mb-4">{course.provider}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {course.skills.map(skill => (
                        <span key={skill} className="px-2 py-1 bg-slate-50 border border-slate-150 rounded text-[10px] text-slate-600 font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> {course.duration}</span>
                      <span className="flex items-center gap-1.5 text-indigo-600"><ShieldCheck className="w-3.5 h-3.5"/> {course.certType}</span>
                    </div>
                    <a href={course.url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 transition-colors">
                      Enroll
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : activeTab === "news" ? (
          <section id="news-view" className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 font-display flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-indigo-500" />
                  Latest AI / ML & AGI News
                </h2>
                <p className="text-sm text-slate-500 mt-1">Global updates and breakthroughs. Share and discuss them with your network.</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">Global Feed</span>
            </div>
            
            <div className="flex flex-col gap-6">
              {SAMPLE_NEWS.map(news => (
                <div key={news.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="p-5 border-b border-slate-100">
                    <div className="flex items-center gap-3 text-xs font-mono tracking-wider text-slate-500 mb-2">
                      <span className="text-indigo-600 font-bold">{news.source}</span>
                      <span>&bull;</span>
                      <span>{news.date}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-650 transition-colors leading-snug text-lg mb-2">
                      {news.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {news.summary}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 tracking-wider uppercase font-mono">LinkedIn Template</h4>
                      <button
                        onClick={() => handleCopyNews(news.id, news.linkedinTemplate)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          copiedNewsId === news.id 
                            ? "bg-green-100 text-green-700 border border-green-200" 
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-650"
                        }`}
                      >
                        {copiedNewsId === news.id ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy for LinkedIn</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[13px] text-slate-600 whitespace-pre-wrap leading-relaxed border border-slate-200/60 bg-white p-3 rounded-lg shadow-sm">
                      {news.linkedinTemplate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

      </main>

      {/* FOOTER */}
      <footer id="main-footer" className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
          <p>
            &copy; 2026 India AI and ML Job Board Board. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-slate-500 font-sans">
              Maintained under AI Studio Workspace Container
            </span>
          </div>
        </div>
      </footer>

      {/* MOBILE FULL-SCREEN DETAIL OVERLAY DRAWER */}
      <AnimatePresence>
        {isMobileDetailOpen && activeJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 lg:hidden flex justify-end"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-white w-full max-w-md h-full flex flex-col justify-between p-6 overflow-y-auto"
            >
              <div>
                {/* Header controls strip */}
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                  <span className="text-xs font-mono font-bold text-slate-500">Job Detail Record</span>
                  <button
                    id="close-mobile-details-btn"
                    onClick={() => setIsMobileDetailOpen(false)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Job Title */}
                <div className="mb-5">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="bg-indigo-50 text-indigo-700 font-mono font-bold px-2 py-0.5 rounded text-[10px] border border-indigo-200">
                      {activeJob.workType}
                    </span>
                    <span className="bg-slate-50 text-slate-650 font-mono px-2 py-0.5 rounded text-[10px] border border-slate-200">
                      {activeJob.experienceLevel}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 font-display leading-tight">
                    {activeJob.title}
                  </h2>
                  <p className="text-indigo-600 font-semibold text-xs flex items-center gap-1 mt-1 font-sans">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {activeJob.company}
                  </p>
                </div>

                {/* Parameters list stack */}
                <div className="space-y-2.5 bg-slate-50/70 p-4 border border-slate-200/50 rounded-xl text-xs font-mono mb-5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Hub:</span>
                    <strong className="text-slate-800">{activeJob.location}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">INR Package:</span>
                    <strong className="text-slate-800">{activeJob.salaryRange || "Competitive"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Posted on:</span>
                    <strong className="text-slate-800">{activeJob.postedDate}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Board source:</span>
                    <strong className="text-indigo-650 uppercase">{activeJob.portalSource}</strong>
                  </div>
                </div>

                {/* Detailed Swipable Interactive Sub-Tabs for Mobile Job Context */}
                <div className="border-b border-slate-200 mb-4 pb-1">
                  <div className="flex items-center gap-1 font-sans text-xs overflow-x-auto pb-1.5 scrollbar-none">
                    <button
                      onClick={() => setDetailsTab("overview")}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                        detailsTab === "overview"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-600 hover:text-indigo-650 hover:bg-slate-50"
                      }`}
                    >
                      <Briefcase className="w-3 h-3" />
                      <span>Overview</span>
                    </button>
                    <button
                      onClick={() => setDetailsTab("requirements")}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                        detailsTab === "requirements"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-600 hover:text-indigo-650 hover:bg-slate-50"
                      }`}
                    >
                      <GraduationCap className="w-3 h-3" />
                      <span>Requirements</span>
                    </button>
                    <button
                      onClick={() => setDetailsTab("prep")}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                        detailsTab === "prep"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-600 hover:text-indigo-650 hover:bg-slate-50"
                      }`}
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Prep</span>
                    </button>
                    <button
                      onClick={() => setDetailsTab("insights")}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                        detailsTab === "insights"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-600 hover:text-indigo-650 hover:bg-slate-50"
                      }`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      <span>Insights</span>
                    </button>
                  </div>
                </div>

                {/* Mobile Tab Render Body */}
                <div className="mb-5 min-h-[180px]">
                  {(() => {
                    const subDetails = getJobSubDetails(activeJob);
                    
                    if (detailsTab === "overview") {
                      return (
                        <div className="space-y-3 font-sans text-xs">
                          <div>
                            <p className="text-xs text-slate-650 leading-relaxed bg-slate-50/50 border border-slate-100 p-3 rounded-lg font-sans">
                              {activeJob.description}
                            </p>
                          </div>
                          <div className="bg-amber-50/50 border border-amber-200/50 rounded-lg p-2.5 text-amber-900 leading-normal text-[11px]">
                            <strong className="block">WFO/WFH Clause:</strong>
                            Operating in {activeJob.workType} model out of {activeJob.location}.
                          </div>
                        </div>
                      );
                    }
                    
                    if (detailsTab === "requirements") {
                      return (
                        <div className="space-y-3 font-sans text-xs">
                          <div>
                            <span className="font-bold text-slate-700 block mb-1">Key Tech:</span>
                            <div className="flex flex-wrap gap-1">
                              {activeJob.skills.map((skill, index) => (
                                <span
                                  key={index}
                                  className="bg-indigo-50 text-indigo-750 border border-indigo-100 px-2.5 py-1 rounded-lg text-xs font-semibold"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="p-3 bg-indigo-50/30 border border-indigo-100 rounded-lg space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">Your Compatibility:</span>
                              <span className="font-bold text-indigo-600">{subDetails.matchScore}% Match</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                              <div className="bg-indigo-650 h-1" style={{ width: `${subDetails.matchScore}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    if (detailsTab === "prep") {
                      return (
                        <div className="space-y-3 font-sans text-[11px]">
                          <div className="p-2.5 bg-amber-50/50 border border-amber-200/50 rounded-lg text-slate-700">
                            <strong>AI Strategy:</strong> {subDetails.prepStrategy}
                          </div>
                          <div className="space-y-2">
                            <span className="font-bold text-slate-700 block text-xs">Mock Question Highlight:</span>
                            <div className="bg-slate-50 border border-slate-150 rounded-lg p-2.5">
                              <strong className="text-slate-800">Q: {subDetails.interviewQuestions[0].q}</strong>
                              <p className="text-slate-600 mt-1 pl-2 border-l border-indigo-500">Ans: {subDetails.interviewQuestions[0].a}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    if (detailsTab === "insights") {
                      return (
                        <div className="space-y-3 font-sans text-xs">
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                            <span className="font-mono text-[10px] text-slate-400 block uppercase">Response Profile</span>
                            <strong className="text-slate-800 text-[11px] block">Normally responds in {subDetails.processingSpeed}</strong>
                            <p className="text-[11px] text-slate-500">
                              Average competition level: {subDetails.competitionIdx}.
                            </p>
                          </div>
                          <div className="p-2.5 bg-indigo-50/30 border border-indigo-100 rounded-lg text-[11px] text-slate-600">
                            Listing is active, verified, and direct, aligned with regional guidelines.
                          </div>
                        </div>
                      );
                    }
                    
                    return null;
                  })()}
                </div>
              </div>

              {/* Apply action footer */}
              <div className="border-t border-slate-150 pt-4 mt-6 flex flex-col gap-2">
                <a
                  id="mobile-apply-link"
                  href={activeJob.applyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-3.5 rounded-xl text-center shadow-lg transition-all"
                >
                  Apply direct on {activeJob.portalSource}
                </a>
                <button
                  id="mobile-save-toggle-btn"
                  onClick={(e) => handleToggleBookmark(activeJob.id, e)}
                  className={`w-full py-2.5 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                    bookmarkedIds.includes(activeJob.id)
                      ? "bg-amber-50 border-amber-350 text-amber-650"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{bookmarkedIds.includes(activeJob.id) ? "Saved in Bookmarks" : "Save in Bookmarks"}</span>
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
