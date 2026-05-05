"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download, Search, Calendar, ChevronDown, Filter, ShieldCheck,
} from "lucide-react";
import { HistoryStatCards }                               from "../../../../components/history/HistoryStatCards";
import { ActivityTable, STATIC_ACTIVITIES,
         mapConversationsToActivities }                   from "../../../../components/history/ActivityTable";
import type { ActivityItem }                              from "../../../../components/history/ActivityTable";
import { useChatStore }                                   from "../../../../store/chatStore";
import { useChat }                                        from "../../../../hooks/useChat";

// ── Date range options ────────────────────────────────────────────────────────

const DATE_OPTIONS = [
  { value: "all",  label: "All Time"      },
  { value: "today",label: "Today"         },
  { value: "7d",   label: "Last 7 days"   },
  { value: "30d",  label: "Last 30 days"  },
  { value: "90d",  label: "Last 3 months" },
] as const;

type DateRange = typeof DATE_OPTIONS[number]["value"];

function isWithinRange(rawDate: string | undefined, range: DateRange): boolean {
  if (!rawDate || range === "all") return true;
  const d   = new Date(rawDate);
  const now = new Date();
  switch (range) {
    case "today": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return d >= start;
    }
    case "7d":  return d >= new Date(now.getTime() - 7  * 864e5);
    case "30d": return d >= new Date(now.getTime() - 30 * 864e5);
    case "90d": return d >= new Date(now.getTime() - 90 * 864e5);
    default:    return true;
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const { conversations, user } = useChatStore();
  const { loadConversations }   = useChat();

  // Filter state
  const [search,       setSearch]       = useState("");
  const [dateRange,    setDateRange]    = useState<DateRange>("all");
  const [activityType, setActivityType] = useState("all");
  const [userFilter,   setUserFilter]   = useState("all");

  useEffect(() => {
    loadConversations().catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Map conversations → activities (falls back to static demo data when empty)
  const allActivities = useMemo<ActivityItem[]>(
    () => conversations.length > 0
      ? mapConversationsToActivities(conversations, user)
      : STATIC_ACTIVITIES,
    [conversations, user],
  );

  // Unique types & users for the dropdowns
  const activityTypes = useMemo(
    () => ["all", ...Array.from(new Set(allActivities.map(a => a.type)))],
    [allActivities],
  );
  const userNames = useMemo(
    () => ["all", ...Array.from(new Set(allActivities.map(a => a.user.name)))],
    [allActivities],
  );

  // Apply all filters
  const filtered = useMemo<ActivityItem[]>(() => {
    const q = search.toLowerCase().trim();
    return allActivities.filter(item => {
      if (q && ![item.type, item.action, item.details, item.project, item.user.name]
        .some(f => f.toLowerCase().includes(q))) return false;
      if (activityType !== "all" && item.type !== activityType) return false;
      if (userFilter   !== "all" && item.user.name !== userFilter) return false;
      if (!isWithinRange(item.rawDate, dateRange)) return false;
      return true;
    });
  }, [allActivities, search, dateRange, activityType, userFilter]);

  const dateLabelText = DATE_OPTIONS.find(o => o.value === dateRange)?.label ?? "All Time";

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">History</h1>
            <p className="text-slate-500 text-sm mt-1">View and track all recent activity across the platform.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-bold bg-white hover:bg-blue-50 transition-colors shadow-sm self-start md:self-center">
            <Download size={16} /> Export History
          </button>
        </div>

        <HistoryStatCards />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">

          {/* Search */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by activity, document name, project, or user..."
              className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Date range — invisible <select> overlaid on the styled div */}
          <div className="relative flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors">
            <Calendar size={18} className="text-slate-400 shrink-0 pointer-events-none" />
            <span className="text-sm font-semibold text-slate-700 pointer-events-none">{dateLabelText}</span>
            <ChevronDown size={14} className="text-slate-400 ml-2 pointer-events-none" />
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as DateRange)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            >
              {DATE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Activity type */}
          <div className="relative flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors">
            <span className="text-sm font-semibold text-slate-700 pointer-events-none">
              {activityType === "all" ? "All Activity Types" : activityType}
            </span>
            <ChevronDown size={14} className="text-slate-400 pointer-events-none" />
            <select
              value={activityType}
              onChange={e => setActivityType(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            >
              {activityTypes.map(t => (
                <option key={t} value={t}>{t === "all" ? "All Activity Types" : t}</option>
              ))}
            </select>
          </div>

          {/* User */}
          <div className="relative flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors">
            <span className="text-sm font-semibold text-slate-700 pointer-events-none">
              {userFilter === "all" ? "All Users" : userFilter}
            </span>
            <ChevronDown size={14} className="text-slate-400 pointer-events-none" />
            <select
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            >
              {userNames.map(n => (
                <option key={n} value={n}>{n === "all" ? "All Users" : n}</option>
              ))}
            </select>
          </div>

          {/* Reset filters */}
          <button
            onClick={() => { setSearch(""); setDateRange("all"); setActivityType("all"); setUserFilter("all"); }}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            <Filter size={18} /> Filters
          </button>

        </div>

        <ActivityTable activities={filtered} />

        <div className="flex flex-col items-center text-center gap-2 pt-6">
          <div className="flex items-center gap-2 text-slate-400 font-medium text-[10px] uppercase tracking-wider">
            <ShieldCheck size={14} /> All activity data is encrypted and stored securely.
          </div>
          <p className="text-slate-400 text-[11px] font-medium">
            Activity logs are for informational purposes and do not replace regulatory judgment.
          </p>
        </div>

      </div>
    </div>
  );
}
