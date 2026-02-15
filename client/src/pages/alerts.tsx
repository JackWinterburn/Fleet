import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Alert } from "@shared/schema";
import { AlertTriangle, Info, AlertCircle, Check, Bell } from "lucide-react";

const severityConfig: Record<string, { icon: typeof Info; color: string; bg: string }> = {
  info: { icon: Info, color: "text-chart-1", bg: "bg-chart-1/10" },
  warning: { icon: AlertTriangle, color: "text-chart-4", bg: "bg-chart-4/10" },
  critical: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

export default function AlertsPage() {
  const { fleetId } = useParams<{ fleetId: string }>();
  const { toast } = useToast();

  const { data: alerts, isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/fleets", fleetId, "alerts"],
  });

  const markReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest("PATCH", `/api/fleets/${fleetId}/alerts/${alertId}`, { isRead: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets", fleetId, "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/fleets/${fleetId}/alerts/mark-all-read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets", fleetId, "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "All alerts marked as read" });
    },
  });

  const unreadCount = alerts?.filter((a) => !a.isRead).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">Alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}` : "No unread alerts"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            data-testid="button-mark-all-read"
          >
            <Check className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : alerts && alerts.length > 0 ? (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const config = severityConfig[alert.severity] || severityConfig.info;
            const Icon = config.icon;
            return (
              <Card
                key={alert.id}
                className={`p-4 ${alert.isRead ? "opacity-60" : ""}`}
                data-testid={`card-alert-${alert.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-md ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-sm">{alert.title}</h3>
                        <Badge variant="secondary" className="text-xs capitalize">{alert.severity}</Badge>
                        <Badge variant="secondary" className="text-xs">{alert.type.replace(/_/g, " ")}</Badge>
                      </div>
                      {!alert.isRead && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => markReadMutation.mutate(alert.id)}
                          data-testid={`button-mark-read-${alert.id}`}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-1">No alerts</h3>
          <p className="text-sm text-muted-foreground">
            Alerts will appear here when tyres need attention.
          </p>
        </Card>
      )}
    </div>
  );
}
