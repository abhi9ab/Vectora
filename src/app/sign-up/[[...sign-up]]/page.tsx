import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900">
      {/* Left Section */}
      <div className="relative hidden w-1/2 p-8 lg:block">
        <div className="h-full w-full overflow-hidden rounded-[2rem] bg-gradient-to-b from-purple-400 via-purple-600 to-black p-8">
          <div className="flex h-full flex-col items-center justify-center px-8 text-center text-white">
            <div className="mb-8">
              <h1 className="font-dancing-script text-4xl font-semibold">Vectora</h1>
            </div>
            <h2 className="mb-6 text-4xl font-bold">Research Smarter</h2>
            <p className="mb-12 text-lg">An AI-powered research assistant with RAG capabilities for comprehensive insights.</p>

            <div className="w-full max-w-sm space-y-4">
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">1</span>
                  <span className="text-lg">Create your account</span>
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white">
                    2
                  </span>
                  <span className="text-lg">Set up your research profile</span>
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white">
                    3
                  </span>
                  <span className="text-lg">Start exploring with AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section with Clerk SignUp */}
      <div className="flex w-full items-center justify-center lg:w-1/2">
        <div className="w-full max-w-md p-4 md:p-8">
          <SignUp appearance={{
            elements: {
              rootBox: "shadow-xl rounded-xl w-full",
              card: "bg-white dark:bg-gray-900 rounded-xl p-6",
              header: "mb-6",
              headerTitle: "text-2xl font-bold",
              headerSubtitle: "text-sm text-gray-500 dark:text-gray-400",
              socialButtonsBlockButton: "border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all",
              formFieldLabel: "text-sm font-medium",
              formFieldInput: "rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2",
              footerAction: "text-sm",
              footerActionLink: "text-primary-600 dark:text-primary-400 font-medium hover:underline"
            }
          }} />
        </div>
      </div>
    </div>
  );
}