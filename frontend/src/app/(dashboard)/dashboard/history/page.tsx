"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download, Search, Calendar, Filter, ShieldCheck,
} from "lucide-react";
import { FilterDropdown } from "../../../../components/ui/FilterDropdown";
import { HistoryStatCards }                               from "../../../../components/history/HistoryStatCards";
import { ActivityTable,
         mapConversationsToActivities }                   from "../../../../components/history/ActivityTable";
import type { ActivityItem }                              from "../../../../components/history/ActivityTable";
import { ConfirmModal }                                   from "../../../../components/ui/ConfirmModal";
import { useChatStore }                                   from "../../../../store/chatStore";
import { useChat }                                        from "../../../../hooks/useChat";
import { chatApi, organizationApi, assessmentApi, simulationApi } from "../../../../lib/api";

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
  const { conversations, user, removeConversation } = useChatStore();
  const { loadConversations }   = useChat();
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [isOrgOwner, setIsOrgOwner]   = useState(false);
  const [docsCount, setDocsCount]     = useState(0);
  const [simsCount, setSimsCount]     = useState(0);

  // Filter state
  const [search,       setSearch]       = useState("");
  const [dateRange,    setDateRange]    = useState<DateRange>("all");
  const [activityType, setActivityType] = useState("all");
  const [userFilter,   setUserFilter]   = useState("all");
  const [chatModeFilter, setChatModeFilter] = useState("all");

  // Pagination state
  const PAGE_SIZE = 20;
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    loadConversations().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user?.organization_id) {
      organizationApi.get()
        .then(org => setIsOrgOwner(org.owner_id === user.id))
        .catch(() => setIsOrgOwner(false));
    } else {
      setIsOrgOwner(false);
    }
  }, [user?.id, user?.organization_id]);

  useEffect(() => {
    assessmentApi.listDocuments().then(docs => setDocsCount(docs.length)).catch(() => {});
    simulationApi.listSessions().then(sims => setSimsCount(sims.length)).catch(() => {});
  }, []);

  const allActivities = useMemo<ActivityItem[]>(
    () => mapConversationsToActivities(conversations, user, isOrgOwner),
    [conversations, user, isOrgOwner],
  );

  const activityTypes = useMemo(
    () => ["all", ...Array.from(new Set(allActivities.map(a => a.type)))],
    [allActivities],
  );
  const userNames = useMemo(
    () => ["all", ...Array.from(new Set(allActivities.map(a => a.user.name)))],
    [allActivities],
  );

  const filtered = useMemo<ActivityItem[]>(() => {
    const q = search.toLowerCase().trim();
    return allActivities.filter(item => {
      if (q && ![item.type, item.action, item.details, item.project, item.user.name]
        .some(f => f.toLowerCase().includes(q))) return false;
      if (activityType !== "all" && item.type !== activityType) return false;
      if (userFilter !== "all" && item.user.name !== userFilter) return false;
      if (chatModeFilter !== "all" && item.chatMode !== chatModeFilter) return false;
      if (!isWithinRange(item.rawDate, dateRange)) return false;
      return true;
    });
  }, [allActivities, search, dateRange, activityType, userFilter, chatModeFilter]);

  // Reset to page 1 when filters change
  useEffect(() => { setHistoryPage(1); }, [search, dateRange, activityType, userFilter, chatModeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedActivities = filtered.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);


  return (
    <div className="min-h-screen bg-gs-bg p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gs-text tracking-tight">History</h1>
            <p className="text-gs-muted text-sm mt-1">View and track all recent activity across the platform.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gs-blue text-gs-blue rounded-lg text-sm font-bold bg-gs-card hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors shadow-sm self-start md:self-center">
            <Download size={16} /> Export History
          </button>
        </div>

        <HistoryStatCards
          totalActivities={allActivities.length}
          docsProcessed={docsCount}
          simulationsRun={simsCount}
          filesUploaded={docsCount}
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">

          {/* Search */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gs-muted" size={18} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by activity, document name, project, or user..."
              className="w-full h-10 pl-10 pr-4 bg-gs-card border border-gs-border rounded-lg text-sm text-gs-text focus:outline-none focus:ring-2 focus:ring-gs-blue/20 transition-all placeholder:text-gs-muted font-medium"
            />
          </div>

          <FilterDropdown
            value={dateRange}
            onChange={v => setDateRange(v as DateRange)}
            icon={<Calendar size={16} />}
            options={DATE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
          />

          <FilterDropdown
            value={activityType}
            onChange={setActivityType}
            options={activityTypes.map(t => ({ value: t, label: t === "all" ? "All Activity Types" : t }))}
          />

          <FilterDropdown
            value={chatModeFilter}
            onChange={setChatModeFilter}
            options={[
              { value: "all",     label: "All Chat Modes" },
              { value: "general", label: "General Mode" },
              { value: "program", label: "Program Mode" },
            ]}
          />

          <FilterDropdown
            value={userFilter}
            onChange={setUserFilter}
            options={userNames.map(n => ({ value: n, label: n === "all" ? "All Users" : n }))}
          />

          {/* Reset filters */}
          <button
            onClick={() => { setSearch(""); setDateRange("all"); setActivityType("all"); setUserFilter("all"); setChatModeFilter("all"); }}
            className="flex items-center gap-2 px-3 py-2 bg-gs-card border border-gs-border rounded-lg text-sm font-bold text-gs-muted hover:bg-gs-bg hover:text-gs-text transition-colors min-h-[40px]"
          >
            <Filter size={16} /> Reset
          </button>

        </div>

        <ActivityTable
          activities={pagedActivities}
          onDeleteChat={id => setDeleteId(id)}
          page={historyPage}
          totalPages={totalPages}
          totalCount={filtered.length}
          onPageChange={setHistoryPage}
        />

        <div className="flex flex-col items-center text-center gap-2 pt-6">
          <div className="flex items-center gap-2 text-gs-muted font-medium text-[10px] uppercase tracking-wider">
            <ShieldCheck size={14} /> All activity data is encrypted and stored securely.
          </div>
          <p className="text-gs-muted text-[11px] font-medium">
            Activity logs are for informational purposes and do not replace regulatory judgment.
          </p>
        </div>

      </div>

      {deleteId && (
        <ConfirmModal
          title="Delete Chat"
          message="This will permanently delete this conversation and all its messages. This action cannot be undone."
          confirmLabel="Delete Chat"
          onCancel={() => setDeleteId(null)}
          onConfirm={async () => {
            try { await chatApi.deleteConversation(deleteId); removeConversation(deleteId); } catch { /* silently fail */ }
            setDeleteId(null);
          }}
        />
      )}
    </div>
  );
}
