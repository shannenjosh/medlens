import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#EEF6F2] relative overflow-x-hidden">
      {/* ── Large Soft Coloured Background Shapes/Blobs Behind Content ── */}
      <div className="pointer-events-none fixed -top-28 -right-28 w-[460px] h-[460px] rounded-full bg-[#DBF0E7] opacity-60 blur-3xl z-0" />
      <div className="pointer-events-none fixed top-1/3 -left-28 w-[420px] h-[420px] rounded-full bg-[#FCE4DE] opacity-55 blur-3xl z-0" />
      <div className="pointer-events-none fixed -bottom-24 right-1/4 w-[480px] h-[480px] rounded-full bg-[#EDE7FA] opacity-60 blur-3xl z-0" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 justify-center w-full min-w-0 relative z-10">
        {children}
      </div>
    </div>
  );
}
