import { Switch, Route, useParams, useLocation, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import AuthPage from "@/pages/auth";
import DashboardPage from "@/pages/dashboard";
import VehiclesPage from "@/pages/vehicles";
import VehicleDetailPage from "@/pages/vehicle-detail";
import TyresPage from "@/pages/tyres";
import StockPage from "@/pages/stock";
import ForecastsPage from "@/pages/forecasts";
import AlertsPage from "@/pages/alerts";
import MembersPage from "@/pages/members";
import { Theme, GlobalTheme } from "@carbon/react";
import {
  Dashboard,
  Van,
  CircleFilled,
  Package,
  ChartBar,
  Alarm,
  UserMultiple,
  Logout,
  Light,
  Asleep,
} from "@carbon/icons-react";
import { Button, Loading } from "@carbon/react";
import type { Fleet } from "@shared/schema";
import { useState, createContext, useContext, useCallback } from "react";

type ThemeMode = "white" | "g100";

const ThemeContext = createContext<{
  mode: ThemeMode;
  toggle: () => void;
}>({ mode: "white", toggle: () => {} });

export function useThemeMode() {
  return useContext(ThemeContext);
}

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("tc-theme") as ThemeMode) || "white";
    }
    return "white";
  });

  const toggle = () => {
    const next = mode === "white" ? "g100" : "white";
    setMode(next);
    localStorage.setItem("tc-theme", next);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      <GlobalTheme theme={mode}>
        <Theme theme={mode} style={{ minHeight: "100vh" }}>
          {children}
        </Theme>
      </GlobalTheme>
    </ThemeContext.Provider>
  );
}

const fleetNavItems = [
  { label: "Vehicles", path: "vehicles", icon: Van },
  { label: "Tyres", path: "tyres", icon: CircleFilled },
  { label: "Stock", path: "stock", icon: Package },
  { label: "Forecasts", path: "forecasts", icon: ChartBar },
  { label: "Alerts", path: "alerts", icon: Alarm },
  { label: "Members", path: "members", icon: UserMultiple },
];

function Sidebar({ currentFleet }: { currentFleet?: Fleet }) {
  const { user, logout } = useAuth();
  const { mode, toggle } = useThemeMode();
  const [location] = useLocation();
  const fleetId = currentFleet?.id;

  return (
    <div className="tc-sidebar" style={{ backgroundColor: "var(--cds-layer, #f4f4f4)" }}>
      <div className="tc-sidebar-header">
        <div className="tc-logo" style={{ backgroundColor: "#0f62fe", color: "#fff" }}>
          <CircleFilled size={16} />
        </div>
        <span data-testid="text-app-name">TyreCommand</span>
      </div>

      <nav className="tc-sidebar-nav">
        <Link href="/">
          <div
            className={`tc-sidebar-link ${location === "/" ? "active" : ""}`}
            data-testid="link-dashboard"
          >
            <Dashboard size={16} />
            <span>Dashboard</span>
          </div>
        </Link>

        {currentFleet && fleetId && (
          <>
            <div className="tc-sidebar-section-label">{currentFleet.name}</div>
            {fleetNavItems.map((item) => {
              const href = `/fleet/${fleetId}/${item.path}`;
              const isActive = location === href || location.startsWith(href + "/");
              return (
                <Link key={item.path} href={href}>
                  <div
                    className={`tc-sidebar-link ${isActive ? "active" : ""}`}
                    data-testid={`link-${item.path}`}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="tc-sidebar-footer">
        <Button
          kind="ghost"
          size="sm"
          hasIconOnly
          renderIcon={mode === "white" ? Asleep : Light}
          iconDescription="Toggle theme"
          onClick={toggle}
          data-testid="button-theme-toggle"
        />
        {user && (
          <Button
            kind="ghost"
            size="sm"
            hasIconOnly
            renderIcon={Logout}
            iconDescription="Sign out"
            onClick={() => logout()}
            data-testid="button-logout"
          />
        )}
        {user && (
          <span style={{ fontSize: "0.75rem", opacity: 0.7, marginLeft: "auto" }} data-testid="text-user-display">
            {user.firstName || user.username}
          </span>
        )}
      </div>
    </div>
  );
}

function FleetPageContent() {
  return (
    <Switch>
      <Route path="/fleet/:fleetId/vehicles/:vehicleId" component={VehicleDetailPage} />
      <Route path="/fleet/:fleetId/vehicles" component={VehiclesPage} />
      <Route path="/fleet/:fleetId/tyres" component={TyresPage} />
      <Route path="/fleet/:fleetId/stock" component={StockPage} />
      <Route path="/fleet/:fleetId/forecasts" component={ForecastsPage} />
      <Route path="/fleet/:fleetId/alerts" component={AlertsPage} />
      <Route path="/fleet/:fleetId/members" component={MembersPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function FleetLayout({ fleetId }: { fleetId: string }) {
  const { data: fleets } = useQuery<Fleet[]>({
    queryKey: ["/api/fleets"],
  });

  const currentFleet = fleets?.find((f) => f.id === fleetId);

  return (
    <div className="tc-app-layout">
      <Sidebar currentFleet={currentFleet} />
      <div className="tc-main">
        <div className="tc-topbar">
          {currentFleet && (
            <span style={{ fontSize: "0.875rem", opacity: 0.7 }}>{currentFleet.name}</span>
          )}
        </div>
        <div className="tc-content">
          <FleetPageContent />
        </div>
      </div>
    </div>
  );
}

function MainLayout() {
  return (
    <div className="tc-app-layout">
      <Sidebar />
      <div className="tc-main">
        <div className="tc-topbar">
          <span style={{ fontSize: "0.875rem", opacity: 0.7 }}>Overview</span>
        </div>
        <div className="tc-content">
          <DashboardPage />
        </div>
      </div>
    </div>
  );
}

function FleetRoute() {
  const { fleetId } = useParams<{ fleetId: string }>();
  return <FleetLayout fleetId={fleetId!} />;
}

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={MainLayout} />
      <Route path="/fleet/:fleetId/vehicles/:vehicleId" component={FleetRoute} />
      <Route path="/fleet/:fleetId/vehicles" component={FleetRoute} />
      <Route path="/fleet/:fleetId/tyres" component={FleetRoute} />
      <Route path="/fleet/:fleetId/stock" component={FleetRoute} />
      <Route path="/fleet/:fleetId/forecasts" component={FleetRoute} />
      <Route path="/fleet/:fleetId/alerts" component={FleetRoute} />
      <Route path="/fleet/:fleetId/members" component={FleetRoute} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <Loading withOverlay={false} description="Loading..." data-testid="loading-spinner" />
      </div>
    );
  }

  if (!user) {
    if (showAuth) {
      return <AuthPage />;
    }
    return <LandingPage onLogin={() => setShowAuth(true)} />;
  }

  return <AuthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeWrapper>
        <AppContent />
      </ThemeWrapper>
    </QueryClientProvider>
  );
}

export default App;
