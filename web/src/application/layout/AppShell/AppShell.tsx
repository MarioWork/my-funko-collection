import { SidebarInset, SidebarProvider } from '@components/ui/sidebar';
import { Toaster } from '@components/ui/toast';
import { useIsDesktop } from '@hooks/useMediaQuery';
import AppSidebar from './components/AppSidebar';
import BottomNav from './components/BottomNav';
import DemoBanner from './components/DemoBanner';
import NavigationProgress from './components/NavigationProgress';
import PageOutlet from './components/PageOutlet';
import SearchPalette from './components/SearchPalette';
import TopBar from './components/TopBar';
import { useCommandPalette } from './hooks/useCommandPalette';

// Viewport breakpoints pick the shell; everything inside <main> uses container queries (@container).
// The phone shell's bottom bar height, read by everything that has to clear it.
const MOBILE_SHELL_CLASS = 'flex min-h-svh flex-col [--bottom-nav-height:4rem]';
// shadcn's sidebar is a fixed column; this is as wide as the logo (mark + wordmark), not the 16rem default. A style
// prop, not a class: SidebarProvider sets its own --sidebar-width inline and merges only `style` over it.
const SIDEBAR_STYLE = { '--sidebar-width': '15rem' } as React.CSSProperties;
// The sidebar slides open and shut (200 ms, eased); its menu buttons do not animate their padding, which made the
// labels and icons bounce while the width moved. Reduced motion makes it instant.
const SIDEBAR_MOTION_CLASS =
  '**:data-[slot=sidebar-gap]:ease-out **:data-[slot=sidebar-container]:ease-out **:data-[sidebar=menu-button]:transition-none motion-reduce:**:data-[slot=sidebar-gap]:transition-none motion-reduce:**:data-[slot=sidebar-container]:transition-none';

function AppShell() {
  const isDesktop = useIsDesktop();
  const palette = useCommandPalette();

  if (isDesktop) {
    return (
      <SidebarProvider style={SIDEBAR_STYLE} className={SIDEBAR_MOTION_CLASS}>
        <NavigationProgress />
        <AppSidebar />
        <SidebarInset>
          <DemoBanner />
          {/* SidebarInset is the <main>; this is only the container-query root. */}
          <PageOutlet className="@container mx-auto w-full max-w-7xl flex-1 p-6" />
        </SidebarInset>
        <SearchPalette isOpen={palette.isOpen} onOpenChange={palette.setIsOpen} />
        <Toaster />
      </SidebarProvider>
    );
  }

  return (
    <div className={MOBILE_SHELL_CLASS}>
      <NavigationProgress />
      <DemoBanner />
      <TopBar />
      <main className="@container flex-1 px-4 pt-4 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
        <PageOutlet />
      </main>
      <BottomNav />
      <Toaster />
    </div>
  );
}

export default AppShell;
