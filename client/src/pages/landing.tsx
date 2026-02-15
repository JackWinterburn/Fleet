import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import {
  Truck,
  Shield,
  BarChart3,
  Users,
  ArrowRight,
  Sun,
  Moon,
  Circle,
} from "lucide-react";

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-12">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <Circle className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-base font-semibold tracking-tight" data-testid="text-app-name">
                TyreCommand
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleTheme}
                data-testid="button-theme-toggle"
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
              <a href="/api/login">
                <Button variant="default" data-testid="button-login">
                  Sign in
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-12">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                  <Shield className="w-3 h-3" />
                  Fleet Tyre Management Platform
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight leading-tight" data-testid="text-hero-title">
                  Total tyre control
                  <span className="block font-semibold text-primary">for your fleet</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                  Monitor, manage, and optimise your entire fleet's tyre lifecycle.
                  Reduce costs, extend tyre life, and keep your vehicles safe on the road.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <a href="/api/login">
                    <Button size="lg" data-testid="button-get-started">
                      Get started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-chart-3" />
                    Free to use
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-chart-1" />
                    Collaborative
                  </span>
                </div>
              </div>

              <div className="hidden lg:grid grid-cols-2 gap-3">
                <Card className="p-4 space-y-2">
                  <div className="w-10 h-10 rounded-md bg-chart-1/10 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-chart-1" />
                  </div>
                  <h3 className="font-medium text-sm">Fleet Tracking</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Monitor every vehicle and tyre across your entire operation in real time.
                  </p>
                </Card>
                <Card className="p-4 space-y-2 mt-8">
                  <div className="w-10 h-10 rounded-md bg-chart-3/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-chart-3" />
                  </div>
                  <h3 className="font-medium text-sm">Safety Alerts</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Automatic notifications for worn treads, low pressure, and rotation schedules.
                  </p>
                </Card>
                <Card className="p-4 space-y-2">
                  <div className="w-10 h-10 rounded-md bg-chart-4/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-chart-4" />
                  </div>
                  <h3 className="font-medium text-sm">Cost Forecasts</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Predict replacement costs and stock needs with intelligent forecasting.
                  </p>
                </Card>
                <Card className="p-4 space-y-2 mt-8">
                  <div className="w-10 h-10 rounded-md bg-chart-2/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-chart-2" />
                  </div>
                  <h3 className="font-medium text-sm">Team Collaboration</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Invite team members to manage fleets collaboratively with role-based access.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t bg-card/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-semibold tracking-tight">Everything you need to manage fleet tyres</h2>
              <p className="mt-2 text-muted-foreground">
                A complete solution built for fleet operators and tyre managers.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Vehicle Management",
                  desc: "Register vehicles, track mileage, and manage tyre assignments per axle position.",
                  icon: Truck,
                  color: "chart-1",
                },
                {
                  title: "Tyre Lifecycle",
                  desc: "Track each tyre from purchase through installation, rotation, and eventual replacement.",
                  icon: Circle,
                  color: "chart-2",
                },
                {
                  title: "Stock Control",
                  desc: "Manage your tyre inventory with minimum quantity alerts and cost tracking.",
                  icon: BarChart3,
                  color: "chart-3",
                },
                {
                  title: "Smart Alerts",
                  desc: "Automated warnings for low tread depth, pressure issues, and upcoming rotations.",
                  icon: Shield,
                  color: "chart-4",
                },
                {
                  title: "Cost Analytics",
                  desc: "Forecast tyre replacement costs and identify opportunities to reduce spending.",
                  icon: BarChart3,
                  color: "chart-5",
                },
                {
                  title: "Multi-user Access",
                  desc: "Add team members to fleets with owner, admin, or member roles for secure collaboration.",
                  icon: Users,
                  color: "chart-1",
                },
              ].map((feature) => (
                <Card key={feature.title} className="p-5 space-y-3 hover-elevate">
                  <div
                    className={`w-10 h-10 rounded-md bg-${feature.color}/10 flex items-center justify-center`}
                  >
                    <feature.icon className={`w-5 h-5 text-${feature.color}`} />
                  </div>
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} TyreCommand. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
