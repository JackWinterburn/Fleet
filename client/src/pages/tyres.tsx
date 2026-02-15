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
import { Add, TrashCan, CircleFilled, Edit, Upload } from "@carbon/icons-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Tyre, Vehicle } from "@shared/schema";
import { useState, useEffect } from "react";
import { z } from "zod";
import { getPositionOptionsForVehicle, positionLabels } from "@/lib/tyre-positions";
import BatchUpload, { type FieldDef } from "@/components/batch-upload";

const tyreBatchFields: FieldDef[] = [
  { key: "brand", label: "Brand", required: true, type: "string" },
  { key: "model", label: "Model", required: true, type: "string" },
  { key: "size", label: "Size", required: true, type: "string" },
  { key: "serialNumber", label: "Serial Number", required: true, type: "string" },
  { key: "status", label: "Status", type: "string" },
  { key: "treadDepth", label: "Tread Depth (mm)", type: "number" },
  { key: "pressure", label: "Pressure (psi)", type: "number" },
  { key: "cost", label: "Cost", type: "number" },
  { key: "mileage", label: "Mileage", type: "number" },
];

const tyreFormSchema = z.object({
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

type TyreFormData = z.infer<typeof tyreFormSchema>;

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
  { key: "vehicle", header: "Vehicle" },
  { key: "position", header: "Position" },
  { key: "actions", header: "" },
];

const defaultFormValues: TyreFormData = {
  brand: "",
  model: "",
  size: "",
  serialNumber: "",
  status: "in_stock",
  vehicleId: undefined,
  position: undefined,
  treadDepth: 8,
  pressure: undefined,
  cost: undefined,
};

function TyreFormFields({
  form,
  vehicles,
}: {
  form: ReturnType<typeof useForm<TyreFormData>>;
  vehicles: Vehicle[] | undefined;
}) {
  const watchStatus = form.watch("status");
  const watchVehicleId = form.watch("vehicleId");
  const selectedVehicle = vehicles?.find((v) => v.id === watchVehicleId);

  const positionOptions = selectedVehicle
    ? getPositionOptionsForVehicle(selectedVehicle.type, selectedVehicle.axleCount ?? 2)
    : [];

  const showVehicleAndPosition = watchStatus === "in_use";

  useEffect(() => {
    if (watchStatus !== "in_use") {
      form.setValue("vehicleId", undefined);
      form.setValue("position", undefined);
    }
  }, [watchStatus]);

  useEffect(() => {
    if (!watchVehicleId) {
      form.setValue("position", undefined);
    }
  }, [watchVehicleId]);

  return (
    <>
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
      {showVehicleAndPosition && vehicles && vehicles.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <Select
            id="tyre-vehicle"
            labelText="Assign to Vehicle"
            value={form.watch("vehicleId") ?? ""}
            onChange={(e: any) => form.setValue("vehicleId", e.target.value || undefined)}
            data-testid="select-tyre-vehicle"
          >
            <SelectItem value="" text="Select a vehicle..." />
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={v.id} text={`${v.registration} - ${v.make} ${v.model}`} />
            ))}
          </Select>
        </div>
      )}
      {showVehicleAndPosition && selectedVehicle && positionOptions.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <Select
            id="tyre-position"
            labelText="Position on Vehicle"
            value={form.watch("position") ?? ""}
            onChange={(e: any) => form.setValue("position", e.target.value || undefined)}
            data-testid="select-tyre-position"
          >
            <SelectItem value="" text="Select position..." />
            {positionOptions.map((opt, idx) => (
              <SelectItem key={`${opt.value}-${idx}`} value={opt.value} text={opt.label} />
            ))}
          </Select>
        </div>
      )}
    </>
  );
}

export default function TyresPage() {
  const { fleetId } = useParams<{ fleetId: string }>();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingTyre, setEditingTyre] = useState<Tyre | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);

  const { data: tyres, isLoading } = useQuery<Tyre[]>({
    queryKey: ["/api/fleets", fleetId, "tyres"],
  });

  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/fleets", fleetId, "vehicles"],
  });

  const addForm = useForm<TyreFormData>({
    resolver: zodResolver(tyreFormSchema),
    defaultValues: defaultFormValues,
  });

  const editForm = useForm<TyreFormData>({
    resolver: zodResolver(tyreFormSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (editingTyre) {
      editForm.reset({
        brand: editingTyre.brand,
        model: editingTyre.model,
        size: editingTyre.size,
        serialNumber: editingTyre.serialNumber,
        status: editingTyre.status as any,
        vehicleId: editingTyre.vehicleId ?? undefined,
        position: editingTyre.position ?? undefined,
        treadDepth: editingTyre.treadDepth ?? 8,
        pressure: editingTyre.pressure ?? undefined,
        cost: editingTyre.cost ?? undefined,
      });
    }
  }, [editingTyre]);

  const addTyreMutation = useMutation({
    mutationFn: async (data: TyreFormData) => {
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
      setAddModalOpen(false);
      addForm.reset(defaultFormValues);
    },
  });

  const editTyreMutation = useMutation({
    mutationFn: async (data: TyreFormData) => {
      if (!editingTyre) return;
      const payload = {
        ...data,
        vehicleId: data.status === "in_use" ? (data.vehicleId || null) : null,
        position: data.status === "in_use" ? (data.position || null) : null,
      };
      const res = await apiRequest("PATCH", `/api/fleets/${fleetId}/tyres/${editingTyre.id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets", fleetId, "tyres"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fleets", fleetId, "vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setEditingTyre(null);
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

  const batchMutation = useMutation({
    mutationFn: async (data: Record<string, any>[]) => {
      const res = await apiRequest("POST", `/api/fleets/${fleetId}/tyres/batch`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets", fleetId, "tyres"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setBatchOpen(false);
    },
  });

  const onAddSubmit = addForm.handleSubmit((d) => addTyreMutation.mutate(d));
  const onEditSubmit = editForm.handleSubmit((d) => editTyreMutation.mutate(d));

  const rows = (tyres ?? []).map((t) => {
    const v = vehicles?.find((v) => v.id === t.vehicleId);
    return {
      id: t.id,
      serialNumber: t.serialNumber,
      brandModel: `${t.brand} ${t.model}`,
      size: t.size,
      status: t.status,
      tread: t.treadDepth ?? 0,
      vehicle: v ? `${v.registration}` : "—",
      position: t.position ? (positionLabels[t.position] || t.position.replace(/_/g, " ")) : "—",
      actions: "",
    };
  });

  return (
    <div>
      <div className="tc-page-header">
        <div>
          <h1 data-testid="text-page-title">Tyres</h1>
          <p>Track and manage all fleet tyres</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button kind="tertiary" renderIcon={Upload} onClick={() => setBatchOpen(true)} data-testid="button-batch-upload-tyres">
            Batch Upload
          </Button>
          <Button kind="primary" renderIcon={Add} onClick={() => setAddModalOpen(true)} data-testid="button-add-tyre">
            Add Tyre
          </Button>
        </div>
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
                              <div style={{ display: "flex", gap: "0.25rem" }}>
                                <Button
                                  kind="ghost"
                                  size="sm"
                                  hasIconOnly
                                  renderIcon={Edit}
                                  iconDescription="Edit"
                                  onClick={() => tyre && setEditingTyre(tyre)}
                                  data-testid={`button-edit-tyre-${row.id}`}
                                />
                                <Button
                                  kind="ghost"
                                  size="sm"
                                  hasIconOnly
                                  renderIcon={TrashCan}
                                  iconDescription="Delete"
                                  onClick={() => deleteTyreMutation.mutate(row.id)}
                                  data-testid={`button-delete-tyre-${row.id}`}
                                />
                              </div>
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
          <Button kind="primary" renderIcon={Add} onClick={() => setAddModalOpen(true)} data-testid="button-add-tyre-empty">
            Add Tyre
          </Button>
        </Tile>
      )}

      <Modal
        open={addModalOpen}
        onRequestClose={() => { setAddModalOpen(false); addForm.reset(defaultFormValues); }}
        onRequestSubmit={onAddSubmit}
        modalHeading="Add Tyre"
        primaryButtonText={addTyreMutation.isPending ? "Adding..." : "Add Tyre"}
        secondaryButtonText="Cancel"
        primaryButtonDisabled={addTyreMutation.isPending}
        size="lg"
        data-testid="modal-add-tyre"
      >
        <TyreFormFields form={addForm} vehicles={vehicles} />
      </Modal>

      <Modal
        open={!!editingTyre}
        onRequestClose={() => setEditingTyre(null)}
        onRequestSubmit={onEditSubmit}
        modalHeading="Edit Tyre"
        primaryButtonText={editTyreMutation.isPending ? "Saving..." : "Save Changes"}
        secondaryButtonText="Cancel"
        primaryButtonDisabled={editTyreMutation.isPending}
        size="lg"
        data-testid="modal-edit-tyre"
      >
        <TyreFormFields form={editForm} vehicles={vehicles} />
      </Modal>

      <BatchUpload
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        onSubmit={(data) => batchMutation.mutate(data)}
        isPending={batchMutation.isPending}
        entityName="Tyre"
        fields={tyreBatchFields}
      />
    </div>
  );
}
