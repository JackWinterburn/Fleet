import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { TrendingUp, DollarSign, AlertTriangle, Circle } from "lucide-react";

const CHART_COLORS = [
  "hsl(201, 96%, 32%)",
  "hsl(271, 81%, 38%)",
  "hsl(142, 76%, 30%)",
  "hsl(28, 92%, 42%)",
  "hsl(340, 82%, 40%)",
];

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

  const totalStockValue = stockItems?.reduce((sum, s) => sum + (s.quantity * (s.unitCost ?? 0)), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">Forecasts & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Tyre performance insights and cost projections</p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg Tread</span>
                <Circle className="w-4 h-4 text-chart-1" />
              </div>
              <p className="text-2xl font-semibold mt-2" data-testid="text-avg-tread">{avgTreadDepth.toFixed(1)}mm</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Need Replacing</span>
                <AlertTriangle className="w-4 h-4 text-chart-4" />
              </div>
              <p className="text-2xl font-semibold mt-2" data-testid="text-need-replacing">{needingReplacementSoon}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tyre Spend</span>
                <DollarSign className="w-4 h-4 text-chart-3" />
              </div>
              <p className="text-2xl font-semibold mt-2" data-testid="text-tyre-spend">${totalTyreCost.toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Stock Value</span>
                <TrendingUp className="w-4 h-4 text-chart-2" />
              </div>
              <p className="text-2xl font-semibold mt-2" data-testid="text-stock-value">${totalStockValue.toLocaleString()}</p>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-medium mb-4">Tread Depth Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={treadData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-4">Tyre Status Breakdown</h3>
              <div className="h-64">
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
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    No tyre data available
                  </div>
                )}
              </div>
            </Card>
          </div>

          {needingReplacementSoon > 0 && (
            <Card className="p-4 bg-chart-4/5 border-chart-4/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">Replacement Forecast</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {needingReplacementSoon} tyre{needingReplacementSoon > 1 ? "s" : ""} currently in use
                    {needingReplacementSoon > 1 ? " have" : " has"} tread depth below 3mm and will need replacing soon.
                    Estimated replacement cost: <span className="font-semibold">${(needingReplacementSoon * 350).toLocaleString()}</span> (based on average tyre cost).
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
