import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }) {
return (
<div className="min-h-screen bg-[#06131f] text-sky-50">
<div className="flex min-h-screen">
<Sidebar />

    <main className="relative min-w-0 flex-1 overflow-x-hidden">
      {/* Ambient sky-blue background glow */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute left-[15%] top-[-10%] h-96 w-96 rounded-full bg-sky-400/5 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[5%] h-96 w-96 rounded-full bg-sky-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[1800px] p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </main>
  </div>
</div>

);
}