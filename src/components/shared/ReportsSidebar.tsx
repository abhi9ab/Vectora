"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { useDeepResearchStore } from "@/store/global-state";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';

interface SavedReport {
  id: string;
  topic: string;
  createdAt: string;
}

export default function ReportsSidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setReport, setTopic } = useDeepResearchStore();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      fetchReports();
    }
  }, [isSignedIn]);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports');
      const data = await response.json();
      setReports(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setIsLoading(false);
    }
  };

  const handleReportClick = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`);
      const data = await response.json();
      
      if (data.error) {
        console.error('Error fetching report:', data.error);
        return;
      }

      // Set the report content and topic but don't set isCompleted
      setReport(data.content);
      setTopic(data.topic);

      // Navigate to the research dashboard if not already there
      if (window.location.pathname !== '/research-dashboard') {
        router.push('/research-dashboard');
      }

    } catch (error) {
      console.error('Failed to fetch report content:', error);
    }
  };

  if (!isSignedIn) return null;

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-white/80 backdrop-blur-xl border-r 
      border-gray-200/50 shadow-lg transition-all duration-300 z-40
      ${isExpanded ? 'w-64' : 'w-12'}`}
    >
      <Button
        variant="ghost"
        size="sm"
        className="absolute -right-3 top-4 p-0 w-6 h-6 rounded-full bg-white shadow-md border border-gray-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {isExpanded && (
        <div className="p-4 pt-12">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ScrollText className="h-4 w-4" />
            Research History
          </h3>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
              {reports.map((report) => (
                <Button
                  key={report.id}
                  variant="ghost"
                  className="w-full justify-start text-left text-sm truncate hover:bg-gray-100 p-3"
                  onClick={() => handleReportClick(report.id)}
                >
                  <div className="truncate w-full">
                    <div className="font-medium truncate">{report.topic}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Button>
              ))}

              {reports.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-8">
                  No research history yet
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}