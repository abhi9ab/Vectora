import { auth } from "@clerk/nextjs";
import LandingPage from "@/components/landing-page/LandingPage";
import { UserButton } from "@clerk/nextjs";
import { Brain } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const { userId } = auth();

  if (!userId) {
    return <LandingPage />;
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-start gap-8 py-16 relative text-white">
      Hello
    </main>
  );
}