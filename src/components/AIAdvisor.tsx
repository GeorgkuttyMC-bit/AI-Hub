import React, { useState } from "react";
import { Sparkles, Send, Loader2, Compass, Award, MapPin, Landmark } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const SUGGESTED_QUESTIONS = [
  {
    icon: Landmark,
    label: "Kochi AI Ecosystem",
    query: "What are the primary IT parks (like Infopark) and hot startups hiring ML scholars in Kochi?"
  },
  {
    icon: Award,
    label: "Bangalore ML Salaries",
    query: "State high-fidelity salary ranges for Junior, Mid, and Senior AI/ML roles in Bangalore for 2026."
  },
  {
    icon: Compass,
    label: "WFO vs WFH Trends",
    query: "Which Indian tech hubs require WFO vs offering Hybrid/Remote roles for Deep Learning?"
  },
  {
    icon: MapPin,
    label: "Metro Hub Profiles",
    query: "Briefly contrast the AI/ML landscapes of Hyderabad, Chennai, Mumbai, and Delhi NCR."
  }
];

export default function AIAdvisor() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  const handleAsk = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    setLoading(true);
    setAnswer(null);

    try {
      const response = await fetch("/api/career-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: textToSend })
      });
      const data = await response.json();
      if (data.success) {
        setAnswer(data.answer);
      } else {
        setAnswer(data.answer || "Could not retrieve advisory report. Please ensure your Gemini key is loaded.");
      }
    } catch (err: any) {
      setAnswer(`Error communicating with Server Coach: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Simple custom text parser to render basic Markdown elements safely in React 19
  const formatMarkdown = (text: string) => {
    return text.split("\n").map((line, index) => {
      let content = line.trim();
      if (!content) return <div key={index} className="h-2" />;

      // Headers (e.g., ### Title)
      if (content.startsWith("###")) {
        return (
          <h4 key={index} className="text-sm font-semibold text-slate-905 mt-3 mb-1 font-display flex items-center gap-1">
            <span className="w-1 h-3 bg-indigo-500 rounded-full inline-block" />
            {content.replace(/^###\s*/, "")}
          </h4>
        );
      }
      if (content.startsWith("##") || content.startsWith("#")) {
        return (
          <h3 key={index} className="text-base font-bold text-indigo-900 mt-4 mb-2 font-display">
            {content.replace(/^#+\s*/, "")}
          </h3>
        );
      }

      // Bullets (e.g., * Item or - Item)
      if (content.startsWith("*") || content.startsWith("-")) {
        const bulletText = content.replace(/^[\*\-]\s*/, "");
        // Bold segments inside bullet
        return (
          <li key={index} className="text-xs text-slate-600 ml-4 list-disc pl-1 py-0.5 leading-relaxed">
            {parseBoldText(bulletText)}
          </li>
        );
      }

      // Check for numbered lists (e.g., "1. ")
      const numberedMatch = content.match(/^(\d+)\.\s(.*)/);
      if (numberedMatch) {
         return (
           <div key={index} className="text-xs text-slate-600 ml-4 pl-1 py-0.5 leading-relaxed flex items-start gap-1">
             <span className="font-mono font-bold text-indigo-600">{numberedMatch[1]}.</span>
             <span>{parseBoldText(numberedMatch[2])}</span>
           </div>
         );
      }

      // Normal line
      return <p key={index} className="text-xs text-slate-600 leading-relaxed py-1">{parseBoldText(content)}</p>;
    });
  };

  // Parse bold text like **word** inside lines
  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    if (parts.length === 1) return text;
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-800">{part}</strong> : part);
  };

  return (
    <div id="ai-advisor-panel" className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900 font-display">
            India AI Career Advisor & Placement Assistant
          </h3>
          <p className="text-xs text-slate-500">
            Powered by Gemini. Instantly request salary reports, IT park breakdowns, and preparation advice.
          </p>
        </div>
      </div>

      {/* Suggested Questions Quick Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {SUGGESTED_QUESTIONS.map((s, idx) => {
          const IconComponent = s.icon;
          return (
            <button
              key={idx}
              id={`quick-question-${idx}`}
              onClick={() => {
                setQuery(s.query);
                handleAsk(s.query);
              }}
              className="flex items-center gap-2.5 text-left p-2.5 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all text-xs text-slate-700 shadow-sm"
              disabled={loading}
            >
              <div className="p-1.5 bg-slate-100 text-indigo-600 rounded-md shrink-0">
                <IconComponent className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium truncate">{s.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          id="advisor-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAsk(query);
          }}
          placeholder="Ask about placement advice, local Kochi startups, interview questions..."
          className="flex-1 bg-white border border-slate-200 focus:border-indigo-500 outline-none rounded-xl px-4 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:ring-1 focus:ring-indigo-100 transition-all font-sans"
          disabled={loading}
        />
        <button
          id="advisor-ask-button"
          onClick={() => handleAsk(query)}
          disabled={loading || !query.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl text-xs flex items-center justify-center font-medium gap-1.5 transition-all shadow-md shadow-indigo-100 shrink-0 disabled:bg-slate-300 disabled:shadow-none cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Advise Me</span>
            </>
          )}
        </button>
      </div>

      {/* Answer Board */}
      <AnimatePresence mode="wait">
        {(loading || answer) && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-4 p-4 bg-white border border-slate-200/60 rounded-xl max-h-72 overflow-y-auto shadow-inner"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="text-[11px] font-mono tracking-wider animate-pulse uppercase">Evaluating Indian Tech Market Trends...</span>
              </div>
            ) : (
              <div className="space-y-1 font-sans">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                  <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider">Advisor Consultation Report</span>
                  <button
                    id="clear-guide-response"
                    onClick={() => { setAnswer(null); setQuery(""); }}
                    className="text-[10px] hover:underline text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
                <div className="text-slate-700 leading-relaxed font-sans">
                  {answer && formatMarkdown(answer)}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
