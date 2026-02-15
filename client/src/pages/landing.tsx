import { Button, ClickableTile } from "@carbon/react";
import { useThemeMode } from "@/App";
import {
  Van,
  Security,
  ChartBar,
  UserMultiple,
  ArrowRight,
  CircleFilled,
  Light,
  Asleep,
} from "@carbon/icons-react";

const features = [
  {
    title: "Vehicle Management",
    desc: "Register vehicles, track mileage, and manage tyre assignments per axle position.",
    Icon: Van,
  },
  {
    title: "Tyre Lifecycle",
    desc: "Track each tyre from purchase through installation, rotation, and eventual replacement.",
    Icon: CircleFilled,
  },
  {
    title: "Stock Control",
    desc: "Manage your tyre inventory with minimum quantity alerts and cost tracking.",
    Icon: ChartBar,
  },
  {
    title: "Smart Alerts",
    desc: "Automated warnings for worn treads, low pressure, and upcoming rotations.",
    Icon: Security,
  },
  {
    title: "Cost Analytics",
    desc: "Forecast tyre replacement costs and identify opportunities to reduce spending.",
    Icon: ChartBar,
  },
  {
    title: "Multi-user Access",
    desc: "Add team members to fleets with owner, admin, or member roles for secure collaboration.",
    Icon: UserMultiple,
  },
];

export default function LandingPage({ onLogin }: { onLogin: () => void }) {
  const { mode, toggle } = useThemeMode();

  return (
    <div style={{ minHeight: "100vh" }}>
      <nav className="tc-landing-nav" style={{ backgroundColor: "var(--cds-layer, #f4f4f4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: "2rem",
              height: "2rem",
              borderRadius: "0.375rem",
              backgroundColor: "#0f62fe",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircleFilled size={16} />
          </div>
          <span style={{ fontWeight: 600 }} data-testid="text-app-name">
            TyreCommand
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Button
            kind="ghost"
            size="sm"
            hasIconOnly
            renderIcon={mode === "white" ? Asleep : Light}
            iconDescription="Toggle theme"
            onClick={toggle}
            data-testid="button-theme-toggle"
          />
          <Button kind="primary" size="sm" data-testid="button-login" onClick={onLogin}>
            Sign in
          </Button>
        </div>
      </nav>

      <main style={{ paddingTop: "3rem" }}>
        <section className="tc-hero">
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0.75rem", borderRadius: "0.25rem", backgroundColor: "rgba(15, 98, 254, 0.1)", color: "#0f62fe", fontSize: "0.75rem", fontWeight: 500, marginBottom: "1rem" }}>
            <Security size={12} />
            Fleet Tyre Management Platform
          </div>
          <h1 data-testid="text-hero-title">
            Total tyre control
            <br />
            <strong style={{ color: "#0f62fe" }}>for your fleet</strong>
          </h1>
          <p>
            Monitor, manage, and optimise your entire fleet's tyre lifecycle.
            Reduce costs, extend tyre life, and keep your vehicles safe on the road.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <Button kind="primary" renderIcon={ArrowRight} data-testid="button-get-started" onClick={onLogin}>
              Get started
            </Button>
          </div>
          <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.875rem", opacity: 0.6 }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Security size={14} /> Free to use
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <UserMultiple size={14} /> Collaborative
            </span>
          </div>
        </section>

        <section style={{ borderTop: "1px solid var(--cds-border-subtle, #e0e0e0)", paddingTop: "3rem", paddingBottom: "3rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem", padding: "0 2rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Everything you need to manage fleet tyres</h2>
            <p style={{ opacity: 0.7, marginTop: "0.5rem" }}>
              A complete solution built for fleet operators and tyre managers.
            </p>
          </div>
          <div className="tc-features-grid">
            {features.map((f) => (
              <ClickableTile key={f.title} className="tc-feature-tile">
                <f.Icon size={24} style={{ color: "#0f62fe" }} />
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </ClickableTile>
            ))}
          </div>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid var(--cds-border-subtle, #e0e0e0)", padding: "1.5rem 2rem", fontSize: "0.875rem", opacity: 0.5 }}>
        &copy; {new Date().getFullYear()} TyreCommand. All rights reserved.
      </footer>
    </div>
  );
}
