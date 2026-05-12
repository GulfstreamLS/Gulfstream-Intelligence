"use client";

import Link from "next/link";
import { FileText, ChevronRight, MessageSquare } from "lucide-react";
import type { AnalyzedDocument } from "../../types";

interface Props {
  recentDocs: AnalyzedDocument[];
}

function fileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext === "pdf" ? "text-red-400" : "text-blue-400";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function AIPoweredExtraction({ recentDocs }: Props) {
  return (
    <div className="bg-gs-card p-7 rounded-2xl border border-gs-border shadow-card">
      <h3 className="text-[16px] font-bold text-gs-text mb-5">AI-Powered Extraction</h3>

      {/* Chat redirect nudge — replaces the upload drop zone */}
      <div className="border-2 border-dashed border-gs-border rounded-xl p-6 flex flex-col items-center justify-center gap-3 mb-6 bg-gs-bg/40">
        <div className="w-12 h-12 rounded-full bg-gs-bg border border-gs-border flex items-center justify-center text-gs-blue">
          <MessageSquare className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-[13px] font-bold text-gs-text">
            Analyze documents in Regulatory Chat
          </p>
          <p className="text-[12px] text-gs-muted mt-1 leading-relaxed">
            Upload a document in chat and ask for an analysis — results will appear here automatically.
          </p>
        </div>
      </div>

      {/* Recent uploads from chat */}
      <h4 className="text-[13px] font-bold text-gs-text mb-3">Recent Uploads</h4>
      <div className="space-y-2 mb-5">
        {recentDocs.length === 0 ? (
          <p className="text-[12px] text-gs-muted font-medium">No documents analyzed yet.</p>
        ) : (
          recentDocs.slice(0, 3).map((doc) => (
            <div key={doc.id} className="flex items-center gap-3">
              <FileText className={`w-4 h-4 shrink-0 ${fileIcon(doc.filename)}`} />
              <span className="text-[12px] font-semibold text-gs-text flex-1 truncate">{doc.filename}</span>
              <span className="text-[11px] text-gs-muted font-medium shrink-0">{formatDate(doc.created_at)}</span>
            </div>
          ))
        )}
      </div>

      <Link
        href="/dashboard/chat"
        className="text-gs-blue text-[13px] font-bold flex items-center gap-1 hover:underline"
      >
        Go to upload center <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
