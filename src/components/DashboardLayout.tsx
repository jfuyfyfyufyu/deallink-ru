import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';
import AnimatedBackground from '@/components/ui/animated-background';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative">
        <AnimatedBackground />
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative z-[1]">
          <header className="h-14 flex items-center gap-3 bg-card/40 backdrop-blur-xl px-4 sticky top-0 z-10 relative">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            {title && (
              <h1 className="text-lg font-semibold tracking-tight truncate flex-1 text-foreground font-display">
                {title}
              </h1>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <NotificationBell />
              <ThemeToggle />
            </div>
            {/* Glow line at bottom */}
            <div className="absolute bottom-0 left-0 right-0 glow-line" />
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto safe-bottom">
            <div className="stagger-children">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
