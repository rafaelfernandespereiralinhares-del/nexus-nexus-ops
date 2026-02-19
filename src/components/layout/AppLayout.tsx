import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import MobileBottomNav from './MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import AIChatSupport from '@/components/AIChatSupport';

export default function AppLayout() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <main className="flex-1 overflow-y-auto pb-20">
          <div className="p-4 max-w-2xl mx-auto">
            <Outlet />
          </div>
        </main>
        <MobileBottomNav />
        <AIChatSupport />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-6">
          <Outlet />
        </div>
      </main>
      <AIChatSupport />
    </div>
  );
}
