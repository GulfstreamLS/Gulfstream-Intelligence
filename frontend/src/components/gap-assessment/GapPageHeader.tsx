export function GapPageHeader() {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-4">
      <div>
        <h1 className="text-[32px] font-bold text-gs-text tracking-tight leading-tight">Global Gap Assessment</h1>
        <p className="text-gs-muted text-[15px] mt-1">Evaluate readiness for your submission across the selected region(s).</p>
        <p className="text-gs-muted text-[13px] font-medium">Identify gaps and prioritize actions for successful approvals.</p>
      </div>
    </div>
  );
}
