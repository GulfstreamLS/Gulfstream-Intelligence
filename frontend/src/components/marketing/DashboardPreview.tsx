import {
  Home, MessageSquare, ClipboardList, Users, FileText,
  FolderOpen, Database, History, Settings, ArrowRight,
} from "lucide-react";
import { WaveIcon } from "../ui/GsLogo";

const SIDEBAR_ITEMS = [
  { icon: Home, label: "Home", active: true },
  { icon: MessageSquare, label: "Regulatory Chat" },
  { icon: ClipboardList, label: "Gap Assessment" },
  { icon: Users, label: "Health Authority Simulation" },
  { icon: FileText, label: "Document Intelligence" },
  { icon: FolderOpen, label: "Projects" },
  { icon: Database, label: "Regulatory Core" },
  { icon: History, label: "History" },
  { icon: Settings, label: "Settings" },
];

const PROGRAM_TAGS = ["Phase 1", "IND", "Global"];

const STATS = [
  { label: "Readiness Score", value: 72, sub: "/100", note: "Moderate Risk", noteColor: "#405a8a96", type: "donut" as const },
  { label: "Top Risks", value: "7", note: "High Priority", noteColor: "#243C76", valueColor: "#DC2626" },
  { label: "Top Gaps", value: "14", note: "Need Attention", noteColor: "#243C76", valueColor: "#2563EB" },
  { label: "Simulation Insights", value: "11", note: "Likely Objections", noteColor: "#243C76", valueColor: "#071B4D" },
];

const RECENT_ITEMS = [
  { label: "FDA Simulation", time: "10m ago", bg: "#fff", color: "#243C76" },
  { label: "CMC Gap Assessment", time: "1h ago", bg: "#fff", color: "#243C76" },
  { label: "IND Application Draft", time: "Yesterday", bg: "#fff", color: "#243C76" },
  { label: "Toxicology Report", time: "2d ago", bg: "#fff", color: "#243C76" },
];

export function DashboardPreview() {
  return (
    <div
      className="ml-auto aspect-[401/253] w-full max-w-[835px] overflow-hidden rounded-[16px] border border-[#DCE6F2] bg-white shadow-[0_22px_60px_rgba(15,42,107,0.16)]"
    >
      <div className="flex h-full">
        {/* Sidebar */}
        <aside className="flex w-[22%] shrink-0 flex-col border-r border-[#E5E7EB] bg-[#F8FAFC] py-5">
          <div className="mb-4 flex items-center px-4">
            <WaveIcon size={44} />
          </div>
          <nav className="flex-1 space-y-1 overflow-hidden px-3">
            {SIDEBAR_ITEMS.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex cursor-pointer items-center gap-2 rounded-[6px] px-2 py-3 transition-colors ${active
                  ? "bg-[#EAF2FF] text-[#2563EB]"
                  : "text-[#64748B] hover:bg-white hover:text-[#0F172A]"
                  }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate text-[10px] font-semibold leading-tight">{label}</span>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1 overflow-hidden">
          {/* Header */}
          <div className="px-8 pb-4 pt-8">
            <p className="text-[26px] font-extrabold leading-tight text-[#071B4D]">
              Welcome back, Alex
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-bold text-[#64748B]">
                Your Program: AAV Gene Therapy for DMD
              </span>
              {PROGRAM_TAGS.map((tag) => (
                <span key={tag} className="flex items-center gap-2 text-[12px] font-bold text-[#405A8A]">
                  <span className="h-1 w-1 rounded-full bg-[#405A8A]" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-6 px-8 pb-8">
            {/* Search bar */}
            <div className="flex h-[52px] items-center gap-3 rounded-[18px] border border-[#DCE6F2] bg-white px-6 shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
              <span className="flex-1 truncate text-[12px] font-bold text-[#64748B]">
                Ask anything about your program, strategy, or regulatory requirements...
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563EB]">
                <ArrowRight className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Stats grid */}
            <div>
              <p className="mb-3 text-[13px] font-extrabold text-[#071B4D]">
                Your Program at a Glance
              </p>
              <div className="grid grid-cols-4 gap-4">
                {STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="min-h-[130px] rounded-[10px] border border-[#DCE6F2] bg-white px-3 py-4 text-center shadow-[0_4px_14px_rgba(15,23,42,0.03)]"
                  >
                    <p className="text-[10px] font-extrabold leading-tight text-[#243C76]">
                      {stat.label}
                    </p>
                    {stat.type === "donut" ? (
                      <ReadinessDonut score={stat.value as number} />
                    ) : (
                      <p
                        className="pt-6 text-[24px] leading-none"
                        style={{ color: stat.valueColor }}
                      >
                        {stat.value}
                      </p>
                    )}
                    <p
                      className="mt-2 text-[10px] font-extrabold"
                      style={{ color: stat.noteColor }}
                    >
                      {stat.note}
                    </p>
                    {stat.type !== "donut" && (
                      <p className="mt-3 cursor-pointer text-[10px] font-extrabold text-[#2563EB]">
                        View All <span aria-hidden="true">→</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent items */}
            <div>
              <p className="mb-3 text-[13px] font-medium text-[#071B4D]">
                Continue where you left off
              </p>
              <div className="grid grid-cols-4 gap-4">
                {RECENT_ITEMS.map((item) => (
                  <div
                    key={item.label}
                    className="min-h-[78px] cursor-pointer rounded-[10px] border border-[#DCE6F2] bg-white px-4 py-3 shadow-[0_4px_14px_rgba(15,23,42,0.03)] transition-shadow hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border"
                        style={{ borderColor: item.color, color: item.color, backgroundColor: item.bg }}
                      >
                        <FileText className="h-2.5 w-2.5" />
                      </div>
                      <p className="truncate text-[11px] font-extrabold leading-tight text-[#243C76]">
                        {item.label}
                      </p>
                    </div>
                    <p className="mt-3 text-[10px] font-bold text-[#405a8a96]">{item.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadinessDonut({ score }: { score: number }) {
  const size = 80;
  const stroke = 8;
  const r = 30;
  const cx = 40;
  const cy = 40;

  // total arc (in degrees) — tweak to match design (240–270)
  const arcAngle = 260;
  const progress = score;

  // convert to stroke math
  const circ = 2 * Math.PI * r;
  const arcLength = (arcAngle / 360) * circ;
  const dash = (progress / 100) * arcLength;
  const gap = circ - arcLength;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      {/* Background arc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#E6EFEA"
        strokeWidth={stroke}
        strokeDasharray={`${arcLength} ${gap}`}
        strokeLinecap="round"
        transform={`rotate(${(360 - arcAngle) / 2 + 90} ${cx} ${cy})`}
      />

      {/* Progress arc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#1F7A63"
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(${(360 - arcAngle) / 2 + 90} ${cx} ${cy})`}
      />

      {/* Value */}
      <text
        x="40"
        y="40"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="20"
        fontWeight="700"
        fill="#1F2A44"
      >
        {progress}
      </text>

      {/* Label */}
      <text
        x="40"
        y="55"
        textAnchor="middle"
        fontSize="9"
        fontWeight="600"
        fill="#7B8BAA"
      >
        /100
      </text>
    </svg>
  );
}
