"use client";
import { Activity } from "@/types/types";
import { useDeepResearchStore } from "@/store/global-state";
import { IconBuildingLighthouse, IconCpu, IconFileSearch, IconMicroscope, IconSearch, IconSpy, IconPhoto } from "@tabler/icons-react";
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { format } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const getActivityIcon = (type: Activity["type"]) => {
  switch (type) {
    case "search":
      return <IconSearch size={16} />;
    case "extract":
      return <IconFileSearch size={16} />;
    case "analyze":
      return <IconMicroscope size={16} />;
    case "generate":
      return <IconCpu size={16} />;
    case "planning":
      return <IconBuildingLighthouse size={16} />;
    case "image-analysis":
      return <IconPhoto size={16} />;
    default:
      return <IconSpy size={16} />;
  }
};

const getStatusColor = (status: Activity["status"]) => {
  switch (status) {
    case "complete":
      return "bg-green-500";
    case "pending":
      return "bg-yellow-500";
    case "warning":
      return "bg-orange-500";
    case "error":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const ActivityItem = ({ activity }: { activity: Activity }) => {
  return (
    <li className="flex flex-col gap-2 border-b p-2 text-sm">
      <div className="flex items-center gap-2">
        <span className={`${getStatusColor(activity.status)} min-w-2 min-h-2 h-2 block rounded-full`}>
          &nbsp;
        </span>
        <div className="flex items-center gap-1">
          <span className="text-gray-600 dark:text-gray-300">
            {getActivityIcon(activity.type)}
          </span>
          <p className="text-gray-300">{activity.message}</p>
        </div>
      </div>
      {activity.timestamp && (
        <span className="text-xs text-muted-foreground">
          {format(new Date(activity.timestamp), "HH:mm:ss")}
        </span>
      )}
    </li>
  );
};

const ResearchActivities = () => {
  const { activities, sources, isLoading } = useDeepResearchStore();
  const [isOpen, setIsOpen] = useState(true);

  if (!activities.length && !isLoading) return null;

  return (
    <div className="w-[90vw] sm:w-[400px] fixed top-4 right-4 z-20">
      <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex justify-end mb-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-9 p-0 bg-white/80 dark:bg-gray-800/90 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm"
            >
              <ChevronDown className={`h-4 w-4 ${isOpen ? 'rotate-180' : ''} text-gray-800 dark:text-gray-200`} />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="h-[50vh]">
          <Tabs defaultValue="activities" className="w-full h-full shadow-md">
            <TabsList className="w-full px-2 py-6">
              <TabsTrigger value="activities" className="flex-1 shadow-none border-black/10 border-solid">
                Activities
              </TabsTrigger>
              {sources && sources.length > 0 && (
                <TabsTrigger value="sources">Sources</TabsTrigger>
              )}
            </TabsList>
            <TabsContent
              value="activities"
              className="h-[calc(100%-60px)] overflow-y-auto border-black/10 border-solid shadow-none bg-white/60 dark:bg-black/40 backdrop-blur-sm border rounded-xl"
            >
              {activities.length === 0 && isLoading ? (
                <div className="flex justify-center items-center py-24">
                  <div className="animate-pulse flex space-x-1">
                    <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
              ) : (
                <ul className="space-y-4 p-4">
                  {activities.map((activity, index) => (
                    <ActivityItem key={index} activity={activity} />
                  ))}
                </ul>
              )}
            </TabsContent>
            {sources && sources.length > 0 && (
              <TabsContent
                value="sources"
                className="h-[calc(100%-60px)] overflow-y-auto shadow-none bg-white/60 dark:bg-black/40 backdrop-blur-sm border rounded-xl border-black/10 border-solid"
              >
                <ul className="space-y-4 p-4">
                  {sources.map((source, index) => (
                    <li key={index} className="flex flex-col gap-2 border-b p-2">
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline">
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </TabsContent>
            )}
          </Tabs>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ResearchActivities;