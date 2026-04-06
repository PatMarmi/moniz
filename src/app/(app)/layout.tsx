import BottomNav from "@/components/bottom-nav";
import SidebarNav from "@/components/sidebar-nav";
import TopHeader from "@/components/top-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-beige">
      <SidebarNav />

      <div className="md:ml-60 flex flex-col min-h-screen">
        <TopHeader />

        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
