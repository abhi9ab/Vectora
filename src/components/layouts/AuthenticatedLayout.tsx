"use client";

import { useAuth } from "@clerk/nextjs";
import ReportsSidebar from "../shared/ReportsSidebar";
import { usePathname } from "next/navigation";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  
  // Show sidebar on research dashboard page
  const showSidebar = isSignedIn && pathname === '/';

  return (
    <div className="min-h-screen">
      {showSidebar && <ReportsSidebar />}
      <main className={`${showSidebar ? "ml-12 lg:ml-64" : ""} transition-all duration-300`}>
        {children}
      </main>
    </div>
  );
}