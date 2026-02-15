import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Tile, SkeletonText, InlineNotification } from "@carbon/react";
import { CircleFilled, WarningAlt, Currency, ChartBar } from "@carbon/icons-react";
import type { Tyre, StockItem } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CHART_COLORS = ["#0f62fe", "#6929c4", "#198038", "#b28600", "#da1e28"];

export default function ForecastsPage() {
  const { fleetId } = useParams<{ fleetId: string }>();

  const { data: tyres, isLoading: tyresLoading } = useQuery<Tyre[]>({
    queryKey: ["/api/fleets", fleetId, "tyres"],
  });

  const { data: stockItems, isLoading: stockLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/fleets", fleetId, "stock"],
  });

  const isLoading = tyresLoading || stockLoading;

  const statusCounts = tyres?.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) ?? {};

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));

  const treadData = [
    { range: "0-2mm", count: tyres?.filter((t) => (t.treadDepth ?? 0) <= 2).length ?? 0 },
    { range: "2-4mm", count: tyres?.filter((t) => (t.treadDepth ?? 0) > 2 && (t.treadDepth ?? 0) <= 4).length ?? 0 },
    { range: "4-6mm", count: tyres?.filter((t) => (t.treadDepth ?? 0) > 4 && (t.treadDepth ?? 0) <= 6).length ?? 0 },
    { range: "6-8mm", count: tyres?.filter((t) => (t.treadDepth ?? 0) > 6 && (t.treadDepth ?? 0) <= 8).length ?? 0 },
    { range: "8mm+", count: tyres?.filter((t) => (t.treadDepth ?? 0) > 8).length ?? 0 },
  ];

  const needingReplacementSoon = tyres?.filter((t) => (t.treadDepth ?? 0) <= 3 && t.status === "in_use").length ?? 0;
  const totalTyreCost = tyres?.reduce((sum, t) => sum + (t.cost ?? 0), 0) ?? 0;
  const avgTreadDepth = tyres && tyres.length > 0
    ? tyres.reduce((sum, t) => sum + (t.treadDepth ?? 0), 0) / tyres.length
    : 0;
  const totalStockValue = stockItems?.reduce((sum, s) => sum + (s.quantity * (Number(s.unitCost) ?? 0)), 0) ?? 0;

  return (
    <div>
      <div className="tc-page-header">
        <div>
          <h1 data-testid="text-page-title">Forecasts & Analytics</h1>
          <p>Tyre performance insights and cost projections</p>
        </div>
      </div>

      {isLoading ? (
        <div className="tc-grid tc-grid-4">
          {[1, 2, 3, 4].map((i) => (
            <Tile key={i}><SkeletonText heading width="50%" /><SkeletonText width="30%" /></Tile>
          ))}
        </div>
      ) : (
        <>
          <div className="tc-grid tc-grid-4" style={{ marginBottom: "1.5rem" }}>
            <Tile className="tc-stat-tile">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="tc-stat-label">Avg Tread</span>
                <CircleFilled size={16} style={{ opacity: 0.5 }} />
              </div>
              <span className="tc-stat-value" data-testid="text-avg-tread">{avgTreadDepth.toFixed(1)}mm</span>
            </Tile>
            <Tile className="tc-stat-tile">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="tc-stat-label">Need Replacing</span>
                <WarningAlt size={16} style={{ opacity: 0.5 }} />
              </div>
              <span className="tc-stat-value" data-testid="text-need-replacing">{needingReplacementSoon}</span>
            </Tile>
            <Tile className="tc-stat-tile">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="tc-stat-label">Tyre Spend</span>
                <Currency size={16} style={{ opacity: 0.5 }} />
              </div>
              <span className="tc-stat-value" data-testid="text-tyre-spend">${totalTyreCost.toLocaleString()}</span>
            </Tile>
            <Tile className="tc-stat-tile">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="tc-stat-label">Stock Value</span>
                <ChartBar size={16} style={{ opacity: 0.5 }} />
              </div>
              <span className="tc-stat-value" data-testid="text-stock-value">${totalStockValue.toLocaleString()}</span>
            </Tile>
          </div>

          <div className="tc-grid tc-grid-2" style={{ marginBottom: "1.5rem" }}>
            <Tile>
              <h3 style={{ fontWeight: 500, marginBottom: "1rem" }}>Tread Depth Distribution</h3>
              <div style={{ height: "16rem" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={treadData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--cds-border-subtle, #e0e0e0)" />
                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0f62fe" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Tile>

            <Tile>
              <h3 style={{ fontWeight: 500, marginBottom: "1rem" }}>Tyre Status Breakdown</h3>
              <div style={{ height: "16rem" }}>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name} (${value})`}
                        labelLine={false}
                      >
                        {statusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.5, fontSize: "0.875rem" }}>
                    No tyre data available
                  </div>
                )}
              </div>
            </Tile>
          </div>

          {needingReplacementSoon > 0 && (
            <InlineNotification
              kind="warning"
              title="Replacement Forecast"
              subtitle={`${needingReplacementSoon} tyre${needingReplacementSoon > 1 ? "s" : ""} currently in use ${needingReplacementSoon > 1 ? "have" : "has"} tread depth below 3mm. Estimated replacement cost: $${(needingReplacementSoon * 350).toLocaleString()}`}
              hideCloseButton
            />
          )}
        </>
      )}
    </div>
  );
}
