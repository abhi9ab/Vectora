"use client";

import ResearchReport from "@/components/research-dashboard/ResearchReport";
import HistoricalReport from "@/components/research-dashboard/HistoricalReport";
import QnA from "@/components/research-dashboard/QnA";
import { useDeepResearchStore } from "@/store/global-state";
import Image from "next/image";
import bg from "../../../public/background.png";

export default function ResearchDashboard() {
  const { isCompleted } = useDeepResearchStore();

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-start gap-8 py-16 relative text-black">
      <div className="fixed inset-0 -z-10">
        <Image
          src={bg}
          alt="Background"
          fill
          priority
          quality={100}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative min-h-screen">
        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <QnA />
            {isCompleted ? <ResearchReport /> : <HistoricalReport />}
          </div>
        </main>
      </div>
    </main>
  );
}
