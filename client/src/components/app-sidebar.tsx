import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Truck,
  Circle,
  Package,
  AlertTriangle,
  Users,
  LogOut,
  BarChart3,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import type { Fleet } from "@shared/schema";

interface AppSidebarProps {
  currentFleet?: Fleet;
}

export function AppSidebar({ currentFleet }: AppSidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const fleetId = currentFleet?.id;

  const mainItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
  ];

  const fleetItems = fleetId
    ? [
        { title: "Vehicles", url: `/fleet/${fleetId}/vehicles`, icon: Truck },
        { title: "Tyres", url: `/fleet/${fleetId}/tyres`, icon: Circle },
        { title: "Stock", url: `/fleet/${fleetId}/stock`, icon: Package },
        { title: "Forecasts", url: `/fleet/${fleetId}/forecasts`, icon: BarChart3 },
        { title: "Alerts", url: `/fleet/${fleetId}/alerts`, icon: AlertTriangle },
        { title: "Members", url: `/fleet/${fleetId}/members`, icon: Users },
      ]
    : [];

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U"
    : "U";

  return (
    <Sidebar>
      <SidebarHeader className="p-3 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
            <Circle className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-semibold tracking-tight block truncate">TyreCommand</span>
            {currentFleet && (
              <span className="text-xs text-muted-foreground block truncate">{currentFleet.name}</span>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase()}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {fleetItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Fleet Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {fleetItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase()}`}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-3 border-t space-y-2">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.profileImageUrl ?? undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle-sidebar">
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
