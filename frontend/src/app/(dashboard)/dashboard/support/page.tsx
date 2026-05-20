import { SupportForm } from "../../../../components/dashboard/SupportForm";

export default function SupportPage() {
  return (
    <div className="p-4 md:p-6 lg:p-10 flex flex-col gap-8 max-w-[1100px] mx-auto w-full">

      {/* Title */}
      <div>
        <h2 className="text-2xl md:text-[32px] font-bold text-gs-text tracking-tight mb-2">
          Support
        </h2>
        <p className="text-gs-muted text-[15px]">
          Have a question or running into an issue? Send it to our support team.
        </p>
      </div>

      <SupportForm />
    </div>
  );
}
