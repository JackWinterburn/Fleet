import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button, Tile, Tag, SkeletonText } from "@carbon/react";
import { Checkmark, Alarm, InformationFilled, WarningAltFilled, ErrorFilled } from "@carbon/icons-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Alert } from "@shared/schema";

const severityConfig: Record<string, { Icon: typeof InformationFilled; color: string; tagType: string }> = {
  info: { Icon: InformationFilled, color: "#0f62fe", tagType: "blue" },
  warning: { Icon: WarningAltFilled, color: "#f1c21b", tagType: "warm-gray" },
  critical: { Icon: ErrorFilled, color: "#da1e28", tagType: "red" },
};

export default function AlertsPage() {
  const { fleetId } = useParams<{ fleetId: string }>();

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
    },
  });

  const unreadCount = alerts?.filter((a) => !a.isRead).length ?? 0;

  return (
    <div>
      <div className="tc-page-header">
        <div>
          <h1 data-testid="text-page-title">Alerts</h1>
          <p>{unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}` : "No unread alerts"}</p>
        </div>
        {unreadCount > 0 && (
          <Button
            kind="secondary"
            renderIcon={Checkmark}
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            data-testid="button-mark-all-read"
          >
            Mark All Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1, 2, 3].map((i) => <Tile key={i}><SkeletonText paragraph lineCount={2} /></Tile>)}
        </div>
      ) : alerts && alerts.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {alerts.map((alert) => {
            const config = severityConfig[alert.severity] || severityConfig.info;
            const { Icon } = config;
            return (
              <Tile
                key={alert.id}
                style={{ opacity: alert.isRead ? 0.6 : 1 }}
                data-testid={`card-alert-${alert.id}`}
              >
                <div className="tc-alert-card" style={{ padding: 0 }}>
                  <div className="tc-alert-icon" style={{ backgroundColor: `${config.color}20` }}>
                    <Icon size={16} style={{ color: config.color }} />
                  </div>
                  <div className="tc-alert-content">
                    <div className="tc-alert-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span className="tc-alert-title">{alert.title}</span>
                        <Tag size="sm" type={config.tagType as any}>{alert.severity}</Tag>
                        <Tag size="sm" type="gray">{alert.type.replace(/_/g, " ")}</Tag>
                      </div>
                      {!alert.isRead && (
                        <Button
                          kind="ghost"
                          size="sm"
                          hasIconOnly
                          renderIcon={Checkmark}
                          iconDescription="Mark as read"
                          onClick={() => markReadMutation.mutate(alert.id)}
                          data-testid={`button-mark-read-${alert.id}`}
                        />
                      )}
                    </div>
                    <p className="tc-alert-message">{alert.message}</p>
                    <p className="tc-alert-time">
                      {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                </div>
              </Tile>
            );
          })}
        </div>
      ) : (
        <Tile className="tc-empty-state">
          <Alarm size={32} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
          <h3>No alerts</h3>
          <p>Alerts will appear here when tyres need attention.</p>
        </Tile>
      )}
    </div>
  );
}
