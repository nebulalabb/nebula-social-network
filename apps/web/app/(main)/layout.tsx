import { Sidebar } from "../../components/shared/sidebar";
import { RightSidebar } from "../../components/shared/right-sidebar";
import { MobileNav } from "../../components/shared/mobile-nav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto flex gap-0 lg:gap-6 px-0 lg:px-4 py-0 lg:py-6">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-20 lg:pb-0 px-3 py-4 lg:px-0 lg:py-0">{children}</main>
        <RightSidebar />
      </div>
      <MobileNav />
    </div>
  );
}
