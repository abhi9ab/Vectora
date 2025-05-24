import { auth } from "@clerk/nextjs";
import LandingPage from "@/components/landing-page/LandingPage";
import QnA from "@/components/research-dashboard/QnA";
import UserInput from "@/components/research-dashboard/UserInput";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import bg from "../../public/background.png";

export default function Home() {
  const { userId } = auth();

  if (!userId) {
    return <LandingPage />;
  }

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

      <header className="w-full container mx-auto px-4 py-4 absolute top-0 left-0 right-0 z-20">
        <div className="flex justify-end items-center">
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-purple-500/20 to-transparent rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-gradient-to-t from-indigo-500/20 to-transparent rounded-full blur-[100px]" />
      </div>

      <div className="flex flex-col items-center gap-6 mt-12">
          <h1 className="text-5xl sm:text-8xl font-bold font-dancing-script italic bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-lg">
            Vectora
          </h1>
          <p className="text-white/90 text-center max-w-[90vw] sm:max-w-[50vw] text-lg">
            Enter a topic and answer a few questions to generate a comprehensive research report.
          </p>
        </div>

      <div className="light w-full max-w-4xl">
        <UserInput />
        <QnA />
      </div>
    </main>
  );
}