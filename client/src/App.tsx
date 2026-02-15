import { Switch, Route, useParams, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import DashboardPage from "@/pages/dashboard";
import VehiclesPage from "@/pages/vehicles";
import TyresPage from "@/pages/tyres";
import StockPage from "@/pages/stock";
import ForecastsPage from "@/pages/forecasts";
import AlertsPage from "@/pages/alerts";
import MembersPage from "@/pages/members";
import type { Fleet } from "@shared/schema";
import { useEffect } from "react";

function FleetLayout() {
  const { fleetId } = useParams<{ fleetId: string }>();

  const { data: fleets } = useQuery<Fleet[]>({
    queryKey: ["/api/fleets"],
  });

  const currentFleet = fleets?.find((f) => f.id === fleetId);

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar currentFleet={currentFleet} />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-2 p-3 border-b h-12 sticky top-0 z-50 bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            {currentFleet && (
              <span className="text-sm text-muted-foreground truncate">{currentFleet.name}</span>
            )}
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6">
            <Switch>
              <Route path="/fleet/:fleetId/vehicles" component={VehiclesPage} />
              <Route path="/fleet/:fleetId/tyres" component={TyresPage} />
              <Route path="/fleet/:fleetId/stock" component={StockPage} />
              <Route path="/fleet/:fleetId/forecasts" component={ForecastsPage} />
              <Route path="/fleet/:fleetId/alerts" component={AlertsPage} />
              <Route path="/fleet/:fleetId/members" component={MembersPage} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function MainLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-2 p-3 border-b h-12 sticky top-0 z-50 bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6">
            <DashboardPage />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={MainLayout} />
      <Route path="/fleet/:fleetId/:rest*" component={FleetLayout} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-3 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <AuthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
