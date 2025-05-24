"use client";
import React, { useState } from "react";
import { useDeepResearchStore } from "@/store/global-state";
import { ChevronDown, NetworkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ResearchGraphVisualization from "./ResearchGraphVisualization";

const ResearchGraph = () => {
  const { isCompleted, topic } = useDeepResearchStore();
  const [isOpen, setIsOpen] = useState(false);

  if (!isCompleted || !topic) return null;

  return (
    <div className="fixed top-20 right-6 z-10 flex flex-col items-end">
      <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex justify-end mb-2">
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 py-2 px-4 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all"
            >
              <NetworkIcon className="h-4 w-4" />
              <span className={isOpen ? "hidden text-gray-300" : "inline text-gray-300"}>Paper Network</span>
              <ChevronDown className={`h-4 w-4 ${isOpen ? "rotate-180" : ""}`} />
              <span className="sr-only">Toggle research graph</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="w-[90vw] md:w-[900px] lg:w-[1100px] max-w-[98vw] h-[80vh] shadow-lg">
          <div className="bg-white/90 backdrop-blur-xl border rounded-xl border-black/10 overflow-hidden h-full">
            <ResearchGraphVisualization />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ResearchGraph;