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
const MOBILE_SHELL_STYLE = { '--bottom-nav-height': '4rem' } as React.CSSProperties;
// shadcn's sidebar is a fixed column; this is as wide as the logo (mark + wordmark), not the 16rem default.
const SIDEBAR_STYLE = { '--sidebar-width': '15rem' } as React.CSSProperties;
// The sidebar opens and closes at once. Animated, the page beside it reflows on every frame (its grids cross
// container-query breakpoints mid-way) and the labels and logo swap before the width catches up: the UI bounces.
const SIDEBAR_NO_ANIMATION_CLASS =
  '**:data-[slot=sidebar-gap]:transition-none **:data-[slot=sidebar-container]:transition-none **:data-[sidebar=menu-button]:transition-none';

function AppShell() {
  const isDesktop = useIsDesktop();
  const palette = useCommandPalette();

  if (isDesktop) {
    return (
      <SidebarProvider style={SIDEBAR_STYLE} className={SIDEBAR_NO_ANIMATION_CLASS}>
        <NavigationProgress />
        <AppSidebar />
        <SidebarInset>
          <DemoBanner />
          <TopBar isDesktop />
          {/* SidebarInset is the <main>; this is only the container-query root. */}
          <PageOutlet className="@container mx-auto w-full max-w-7xl flex-1 p-6" />
        </SidebarInset>
        <SearchPalette isOpen={palette.isOpen} onOpenChange={palette.setIsOpen} />
        <Toaster />
      </SidebarProvider>
    );
  }

  return (
    <div className="flex min-h-svh flex-col" style={MOBILE_SHELL_STYLE}>
      <NavigationProgress />
      <DemoBanner />
      <TopBar isDesktop={false} />
      <main className="@container flex-1 px-4 pt-4 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
        <PageOutlet />
      </main>
      <BottomNav />
      <Toaster />
    </div>
  );
}

export default AppShell;
