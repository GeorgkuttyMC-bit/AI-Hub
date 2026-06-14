import React from "react";
import { Job, WorkType } from "../types";
import { MapPin, IndianRupee, RotateCcw, Sparkles, Building2, Calendar, Star, SquareArrowUpRight } from "lucide-react";
import { motion } from "motion/react";

interface JobCardProps {
  job: Job;
  isSelected: boolean;
  isBookmarked: boolean;
  onClick: () => void;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  isSelected,
  isBookmarked,
  onClick,
  onToggleBookmark
}) => {
  const isAiSourced = job.id.startsWith("ai-");

  // Style helper based on work type
  const getWorkTypeBadgeStyles = (type: WorkType) => {
    switch (type) {
      case "Remote":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "Hybrid":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "WFO":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <motion.div
      id={`job-card-${job.id}`}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
        isSelected
          ? "bg-indigo-50/60 border-indigo-450 ring-1 ring-indigo-400 shadow-md"
          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <div>
        {/* Header containing badges & bookmarks */}
        <div className="flex items-start justify-between gap-1 mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[10px] font-semibold font-mono tracking-wider px-2.5 py-0.5 rounded-full border ${getWorkTypeBadgeStyles(job.workType)}`}>
              {job.workType}
            </span>
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full font-mono">
              {job.experienceLevel}
            </span>
            {isAiSourced && (
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono shadow-sm">
                <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                Live AI
              </span>
            )}
          </div>

          <button
            id={`bookmark-btn-${job.id}`}
            onClick={(e) => onToggleBookmark(job.id, e)}
            className={`p-1.5 rounded-lg border transition-all ${
              isBookmarked
                ? "bg-amber-50 border-amber-300 text-amber-500"
                : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600"
            } cursor-pointer shrink-0`}
            title={isBookmarked ? "Remove Bookmark" : "Save Job Opportunity"}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>

        {/* Title and Company */}
        <h3 className="font-bold text-[16px] text-slate-900 group-hover:text-indigo-600 line-clamp-1 leading-snug font-display mb-1">
          {job.title}
        </h3>
        <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5 mb-3">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {job.company}
        </p>

        {/* Description Snippet */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {job.description}
        </p>

        {/* Skills List */}
        <div className="flex flex-wrap gap-1 mb-4">
          {job.skills.slice(0, 4).map((skill, idx) => (
            <span
              key={idx}
              className="text-[10px] bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded-md font-medium"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="text-[10px] text-slate-400 px-1 py-0.5 self-center font-mono">
              +{job.skills.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Footer Details */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-450 shrink-0" />
          {job.location}
        </span>

        {job.salaryRange && (
          <span className="flex items-center text-slate-700 font-semibold font-sans">
            <IndianRupee className="w-3 h-3 text-slate-450 shrink-0" />
            {job.salaryRange.split(" - ")[0]}
          </span>
        )}

        <span className="text-[10px] text-slate-400">
          Source: {job.portalSource}
        </span>
      </div>
    </motion.div>
  );
};

export default JobCard;
