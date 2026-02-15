import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Fleet } from "@shared/schema";
import {
  Button,
  Tile,
  ClickableTile,
  Modal,
  TextInput,
  TextArea,
  InlineLoading,
  SkeletonText,
} from "@carbon/react";
import { Add, Van, CircleFilled, WarningAlt, Package, ChevronRight } from "@carbon/icons-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createFleetSchema = z.object({
  name: z.string().min(1, "Fleet name is required"),
  description: z.string().optional(),
});

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: fleets, isLoading: fleetsLoading } = useQuery<Fleet[]>({
    queryKey: ["/api/fleets"],
  });

  const { data: stats } = useQuery<{
    totalVehicles: number;
    totalTyres: number;
    activeAlerts: number;
    stockItems: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const form = useForm({
    resolver: zodResolver(createFleetSchema),
    defaultValues: { name: "", description: "" },
  });

  const createFleetMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createFleetSchema>) => {
      const res = await apiRequest("POST", "/api/fleets", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setModalOpen(false);
      form.reset();
    },
  });

  const onSubmit = form.handleSubmit((d) => createFleetMutation.mutate(d));

  const statCards = [
    { label: "Vehicles", value: stats?.totalVehicles ?? 0, Icon: Van },
    { label: "Tyres", value: stats?.totalTyres ?? 0, Icon: CircleFilled },
    { label: "Active Alerts", value: stats?.activeAlerts ?? 0, Icon: WarningAlt },
    { label: "Stock Items", value: stats?.stockItems ?? 0, Icon: Package },
  ];

  return (
    <div>
      <div className="tc-page-header">
        <div>
          <h1 data-testid="text-page-title">Dashboard</h1>
          <p>Overview of your fleet operations</p>
        </div>
        <Button
          kind="primary"
          renderIcon={Add}
          onClick={() => setModalOpen(true)}
          data-testid="button-create-fleet"
        >
          New Fleet
        </Button>
      </div>

      <div className="tc-grid tc-grid-4" style={{ marginBottom: "1.5rem" }}>
        {statCards.map((s) => (
          <Tile key={s.label} className="tc-stat-tile">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="tc-stat-label">{s.label}</span>
              <s.Icon size={16} style={{ opacity: 0.5 }} />
            </div>
            <span className="tc-stat-value" data-testid={`text-stat-${s.label.toLowerCase().replace(/\s/g, "-")}`}>
              {fleetsLoading ? <SkeletonText width="3rem" /> : s.value}
            </span>
          </Tile>
        ))}
      </div>

      <h2 style={{ fontSize: "1.125rem", fontWeight: 500, marginBottom: "0.75rem" }}>Your Fleets</h2>

      {fleetsLoading ? (
        <div className="tc-grid tc-grid-3">
          {[1, 2, 3].map((i) => (
            <Tile key={i}>
              <SkeletonText heading width="60%" />
              <SkeletonText width="80%" />
            </Tile>
          ))}
        </div>
      ) : fleets && fleets.length > 0 ? (
        <div className="tc-grid tc-grid-3">
          {fleets.map((fleet) => (
            <ClickableTile
              key={fleet.id}
              data-testid={`card-fleet-${fleet.id}`}
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/fleet/${fleet.id}/vehicles`)}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontWeight: 500 }}>{fleet.name}</span>
                <ChevronRight size={16} style={{ opacity: 0.5 }} />
              </div>
              {fleet.description && (
                <p style={{ fontSize: "0.875rem", opacity: 0.7, margin: 0 }}>{fleet.description}</p>
              )}
            </ClickableTile>
          ))}
        </div>
      ) : (
        <Tile className="tc-empty-state">
          <Van size={32} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
          <h3>No fleets yet</h3>
          <p>Create your first fleet to start managing your vehicles and tyres.</p>
          <Button kind="primary" renderIcon={Add} onClick={() => setModalOpen(true)} data-testid="button-create-fleet-empty">
            Create Fleet
          </Button>
        </Tile>
      )}

      <Modal
        open={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        onRequestSubmit={onSubmit}
        modalHeading="Create Fleet"
        primaryButtonText={createFleetMutation.isPending ? "Creating..." : "Create Fleet"}
        secondaryButtonText="Cancel"
        primaryButtonDisabled={createFleetMutation.isPending}
        data-testid="modal-create-fleet"
      >
        <div style={{ marginBottom: "1rem" }}>
          <TextInput
            id="fleet-name"
            labelText="Fleet Name"
            placeholder="e.g. North Region Fleet"
            value={form.watch("name")}
            onChange={(e: any) => form.setValue("name", e.target.value)}
            invalid={!!form.formState.errors.name}
            invalidText={form.formState.errors.name?.message}
            data-testid="input-fleet-name"
          />
        </div>
        <TextArea
          id="fleet-description"
          labelText="Description"
          placeholder="Optional description..."
          value={form.watch("description") ?? ""}
          onChange={(e: any) => form.setValue("description", e.target.value)}
          data-testid="input-fleet-description"
        />
      </Modal>
    </div>
  );
}
