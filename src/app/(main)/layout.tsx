import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { HeaderBar } from "@/components/header-bar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex w-full xl:h-screen xl:overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 xl:min-h-0">
        <MobileNav />
        <div className="hidden lg:block">
          <HeaderBar />
        </div>
        {children}
      </main>
    </div>
  );
}
