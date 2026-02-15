import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import {
  Button,
  Modal,
  TextInput,
  NumberInput,
  Select,
  SelectItem,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Tile,
  Tag,
  SkeletonText,
} from "@carbon/react";
import { Add, TrashCan, CircleFilled } from "@carbon/icons-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Tyre, Vehicle } from "@shared/schema";
import { useState } from "react";
import { z } from "zod";

const addTyreSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  size: z.string().min(1, "Size is required"),
  serialNumber: z.string().min(1, "Serial number is required"),
  status: z.enum(["in_use", "in_stock", "worn", "damaged", "disposed", "retreaded"]).default("in_stock"),
  vehicleId: z.string().optional(),
  position: z.string().optional(),
  treadDepth: z.coerce.number().min(0).max(20).default(8),
  pressure: z.coerce.number().min(0).max(200).optional(),
  cost: z.coerce.number().min(0).optional(),
});

const statusTagType: Record<string, string> = {
  in_use: "green",
  in_stock: "blue",
  worn: "warm-gray",
  damaged: "red",
  disposed: "gray",
  retreaded: "teal",
};

const statusLabels: Record<string, string> = {
  in_use: "In Use",
  in_stock: "In Stock",
  worn: "Worn",
  damaged: "Damaged",
  disposed: "Disposed",
  retreaded: "Retreaded",
};

function TreadIndicator({ depth }: { depth: number }) {
  const pct = Math.min(100, (depth / 8) * 100);
  const color = pct > 50 ? "#198038" : pct > 25 ? "#f1c21b" : "#da1e28";
  return (
    <div className="tc-tread-bar">
      <div className="tc-tread-bar-bg" style={{ backgroundColor: "var(--cds-border-subtle, #e0e0e0)" }}>
        <div className="tc-tread-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>{depth.toFixed(1)}mm</span>
    </div>
  );
}

const headers = [
  { key: "serialNumber", header: "Serial" },
  { key: "brandModel", header: "Brand / Model" },
  { key: "size", header: "Size" },
  { key: "status", header: "Status" },
  { key: "tread", header: "Tread" },
  { key: "position", header: "Position" },
  { key: "actions", header: "" },
];

export default function TyresPage() {
  const { fleetId } = useParams<{ fleetId: string }>();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: tyres, isLoading } = useQuery<Tyre[]>({
    queryKey: ["/api/fleets", fleetId, "tyres"],
  });

  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/fleets", fleetId, "vehicles"],
  });

  const form = useForm({
    resolver: zodResolver(addTyreSchema),
    defaultValues: {
      brand: "",
      model: "",
      size: "",
      serialNumber: "",
      status: "in_stock" as const,
      vehicleId: undefined,
      position: undefined,
      treadDepth: 8,
      pressure: undefined,
      cost: undefined,
    },
  });

  const addTyreMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addTyreSchema>) => {
      const payload = {
        ...data,
        vehicleId: data.vehicleId || null,
        position: data.position || null,
      };
      const res = await apiRequest("POST", `/api/fleets/${fleetId}/tyres`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets", fleetId, "tyres"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setModalOpen(false);
      form.reset();
    },
  });

  const deleteTyreMutation = useMutation({
    mutationFn: async (tyreId: string) => {
      await apiRequest("DELETE", `/api/fleets/${fleetId}/tyres/${tyreId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets", fleetId, "tyres"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const onSubmit = form.handleSubmit((d) => addTyreMutation.mutate(d));

  const rows = (tyres ?? []).map((t) => ({
    id: t.id,
    serialNumber: t.serialNumber,
    brandModel: `${t.brand} ${t.model}`,
    size: t.size,
    status: t.status,
    tread: t.treadDepth ?? 0,
    position: t.position ? t.position.replace(/_/g, " ") : "—",
    actions: "",
  }));

  return (
    <div>
      <div className="tc-page-header">
        <div>
          <h1 data-testid="text-page-title">Tyres</h1>
          <p>Track and manage all fleet tyres</p>
        </div>
        <Button kind="primary" renderIcon={Add} onClick={() => setModalOpen(true)} data-testid="button-add-tyre">
          Add Tyre
        </Button>
      </div>

      {isLoading ? (
        <Tile><SkeletonText paragraph lineCount={5} /></Tile>
      ) : tyres && tyres.length > 0 ? (
        <DataTable rows={rows} headers={headers}>
          {({ rows: tableRows, headers: tableHeaders, getHeaderProps, getRowProps, getTableProps }) => (
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {tableHeaders.map((header: any) => (
                    <TableHeader {...getHeaderProps({ header })} key={header.key}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map((row: any) => {
                  const tyre = tyres.find((t) => t.id === row.id);
                  return (
                    <TableRow {...getRowProps({ row })} key={row.id} data-testid={`row-tyre-${row.id}`}>
                      {row.cells.map((cell: any) => {
                        if (cell.info.header === "status") {
                          return (
                            <TableCell key={cell.id}>
                              <Tag size="sm" type={statusTagType[cell.value] as any}>
                                {statusLabels[cell.value]}
                              </Tag>
                            </TableCell>
                          );
                        }
                        if (cell.info.header === "tread") {
                          return (
                            <TableCell key={cell.id}>
                              <TreadIndicator depth={cell.value} />
                            </TableCell>
                          );
                        }
                        if (cell.info.header === "actions") {
                          return (
                            <TableCell key={cell.id}>
                              <Button
                                kind="ghost"
                                size="sm"
                                hasIconOnly
                                renderIcon={TrashCan}
                                iconDescription="Delete"
                                onClick={() => deleteTyreMutation.mutate(row.id)}
                                data-testid={`button-delete-tyre-${row.id}`}
                              />
                            </TableCell>
                          );
                        }
                        return <TableCell key={cell.id}>{cell.value}</TableCell>;
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DataTable>
      ) : (
        <Tile className="tc-empty-state">
          <CircleFilled size={32} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
          <h3>No tyres tracked yet</h3>
          <p>Add your first tyre to begin tracking.</p>
          <Button kind="primary" renderIcon={Add} onClick={() => setModalOpen(true)} data-testid="button-add-tyre-empty">
            Add Tyre
          </Button>
        </Tile>
      )}

      <Modal
        open={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        onRequestSubmit={onSubmit}
        modalHeading="Add Tyre"
        primaryButtonText={addTyreMutation.isPending ? "Adding..." : "Add Tyre"}
        secondaryButtonText="Cancel"
        primaryButtonDisabled={addTyreMutation.isPending}
        size="lg"
        data-testid="modal-add-tyre"
      >
        <div className="tc-form-row tc-form-row-2">
          <TextInput
            id="tyre-brand"
            labelText="Brand"
            placeholder="e.g. Michelin"
            value={form.watch("brand")}
            onChange={(e: any) => form.setValue("brand", e.target.value)}
            invalid={!!form.formState.errors.brand}
            invalidText={form.formState.errors.brand?.message}
            data-testid="input-tyre-brand"
          />
          <TextInput
            id="tyre-model"
            labelText="Model"
            placeholder="e.g. X Multi D"
            value={form.watch("model")}
            onChange={(e: any) => form.setValue("model", e.target.value)}
            invalid={!!form.formState.errors.model}
            invalidText={form.formState.errors.model?.message}
            data-testid="input-tyre-model"
          />
        </div>
        <div className="tc-form-row tc-form-row-2">
          <TextInput
            id="tyre-size"
            labelText="Size"
            placeholder="e.g. 315/80R22.5"
            value={form.watch("size")}
            onChange={(e: any) => form.setValue("size", e.target.value)}
            invalid={!!form.formState.errors.size}
            invalidText={form.formState.errors.size?.message}
            data-testid="input-tyre-size"
          />
          <TextInput
            id="tyre-serial"
            labelText="Serial Number"
            placeholder="e.g. DOT1234"
            value={form.watch("serialNumber")}
            onChange={(e: any) => form.setValue("serialNumber", e.target.value)}
            invalid={!!form.formState.errors.serialNumber}
            invalidText={form.formState.errors.serialNumber?.message}
            data-testid="input-tyre-serial"
          />
        </div>
        <div className="tc-form-row tc-form-row-3">
          <NumberInput
            id="tyre-tread"
            label="Tread (mm)"
            min={0}
            max={20}
            step={0.1}
            value={form.watch("treadDepth")}
            onChange={(_e: any, { value }: any) => form.setValue("treadDepth", value)}
            data-testid="input-tyre-tread"
          />
          <NumberInput
            id="tyre-pressure"
            label="Pressure (PSI)"
            min={0}
            max={200}
            value={form.watch("pressure") ?? 0}
            onChange={(_e: any, { value }: any) => form.setValue("pressure", value || undefined)}
            data-testid="input-tyre-pressure"
          />
          <NumberInput
            id="tyre-cost"
            label="Cost"
            min={0}
            step={0.01}
            value={form.watch("cost") ?? 0}
            onChange={(_e: any, { value }: any) => form.setValue("cost", value || undefined)}
            data-testid="input-tyre-cost"
          />
        </div>
        <div style={{ marginTop: "1rem" }}>
          <Select
            id="tyre-status"
            labelText="Status"
            value={form.watch("status")}
            onChange={(e: any) => form.setValue("status", e.target.value)}
            data-testid="select-tyre-status"
          >
            <SelectItem value="in_stock" text="In Stock" />
            <SelectItem value="in_use" text="In Use" />
            <SelectItem value="worn" text="Worn" />
            <SelectItem value="damaged" text="Damaged" />
            <SelectItem value="retreaded" text="Retreaded" />
          </Select>
        </div>
        {vehicles && vehicles.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <Select
              id="tyre-vehicle"
              labelText="Assign to Vehicle (optional)"
              value={form.watch("vehicleId") ?? ""}
              onChange={(e: any) => form.setValue("vehicleId", e.target.value || undefined)}
              data-testid="select-tyre-vehicle"
            >
              <SelectItem value="" text="None" />
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id} text={`${v.registration} - ${v.make} ${v.model}`} />
              ))}
            </Select>
          </div>
        )}
      </Modal>
    </div>
  );
}
