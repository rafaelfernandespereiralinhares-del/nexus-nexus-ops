import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import MobileBottomNav from './MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';

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
    </div>
  );
}
