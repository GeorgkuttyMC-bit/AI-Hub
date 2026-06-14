import React from "react";
import { Job, WorkType } from "../types";
import { MapPin, Briefcase, Users, LayoutGrid, Globe, Building2 } from "lucide-react";
import { motion } from "motion/react";

interface HubStatsProps {
  jobs: Job[];
  activeLocation: string;
  onSelectLocation: (location: string) => void;
}

export default function HubStats({ jobs, activeLocation, onSelectLocation }: HubStatsProps) {
  // Compute metrics dynamically based on current jobs array (whether mock or combined with live search)
  const locationsList = [
    { name: "All", label: "All India" },
    { name: "Bangalore", label: "Bangalore" },
    { name: "Kochi", label: "Kochi" },
    { name: "Mumbai", label: "Mumbai" },
    { name: "Delhi NCR", label: "Delhi NCR" },
    { name: "Chennai", label: "Chennai" },
    { name: "Hyderabad", label: "Hyderabad" },
    { name: "Pune", label: "Pune" },
    { name: "Kolkata", label: "Kolkata" },
    { name: "Remote", label: "Remote India" }
  ];

  const stats = locationsList.map((loc) => {
    const locJobs = loc.name === "All" 
      ? jobs 
      : jobs.filter(j => j.location.toLowerCase() === loc.name.toLowerCase());
    
    const count = locJobs.length;
    const wfo = locJobs.filter(j => j.workType === "WFO").length;
    const remote = locJobs.filter(j => j.workType === "Remote").length;
    const hybrid = locJobs.filter(j => j.workType === "Hybrid").length;

    return {
      name: loc.name,
      label: loc.label,
      count,
      WFO: wfo,
      Remote: remote,
      Hybrid: hybrid
    };
  });

  return (
    <div id="hub-stats-section" className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 font-display flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Indian AI & ML Tech Hubs
          </h2>
          <p className="text-sm text-slate-500">
            Real-time talent demand segregation across Bangalore, Kochi, and key metros. Click a hub to filter.
          </p>
        </div>
        <div className="text-xs font-mono font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
          Total Base Board: {jobs.length} Listings
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {stats.map((stat) => {
          const isActive = activeLocation.toLowerCase() === stat.name.toLowerCase();

          return (
            <motion.button
              key={stat.name}
              id={`hub-card-${stat.name.toLowerCase().replace(/\s+/g, "-")}`}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectLocation(stat.name)}
              className={`text-left p-4 rounded-xl border transition-all relative overflow-hidden ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100"
                  : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:shadow-md"
              }`}
            >
              {/* Backglow for Kochi / Bangalore which are high priority */}
              {(stat.name === "Bangalore" || stat.name === "Kochi") && !isActive && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-indigo-500 rounded-bl-full" />
              )}

              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-mono font-bold tracking-wider uppercase ${
                  isActive ? "text-indigo-200" : "text-indigo-600"
                }`}>
                  {stat.name === "All" ? "National" : stat.name === "Remote" ? "Distributed" : "Hub City"}
                </span>
                <span className={`text-2xl font-bold font-display ${
                  isActive ? "text-white" : "text-slate-900"
                }`}>
                  {stat.count}
                </span>
              </div>

              <h3 className="font-semibold text-[15px] font-display mb-3 truncate">
                {stat.label}
              </h3>

              {/* Segregated Work Type Breakdowns */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center opacity-85">
                  <span className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : "bg-emerald-500"}`} />
                    Remote WFH:
                  </span>
                  <span className="font-semibold">{stat.Remote}</span>
                </div>
                <div className="flex justify-between items-center opacity-85">
                  <span className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : "bg-sky-500"}`} />
                    Office WFO:
                  </span>
                  <span className="font-semibold">{stat.WFO}</span>
                </div>
                <div className="flex justify-between items-center opacity-85">
                  <span className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : "bg-amber-500"}`} />
                    Hybrid:
                  </span>
                  <span className="font-semibold">{stat.Hybrid}</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
