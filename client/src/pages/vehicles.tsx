import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
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
import { Edit, Add, TrashCan, Van, View, Upload } from "@carbon/icons-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertVehicleSchema, type Vehicle } from "@shared/schema";
import { useState, useEffect } from "react";
import { z } from "zod";
import BatchUpload, { type FieldDef } from "@/components/batch-upload";

const vehicleBatchFields: FieldDef[] = [
  { key: "registration", label: "Registration", required: true, type: "string" },
  { key: "make", label: "Make", required: true, type: "string" },
  { key: "model", label: "Model", required: true, type: "string" },
  { key: "year", label: "Year", type: "number" },
  { key: "type", label: "Type", required: true, type: "string" },
  { key: "currentMileage", label: "Current Mileage", type: "number" },
  { key: "axleCount", label: "Axle Count", type: "number" },
];

const addVehicleSchema = insertVehicleSchema.omit({ fleetId: true });

const headers = [
  { key: "registration", header: "Registration" },
  { key: "makeModel", header: "Make / Model" },
  { key: "type", header: "Type" },
  { key: "year", header: "Year" },
  { key: "mileage", header: "Mileage" },
  { key: "axleCount", header: "Axles" },
  { key: "actions", header: "" },
];

export default function VehiclesPage() {
  const { fleetId } = useParams<{ fleetId: string }>();
  const [, navigate] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/fleets", fleetId, "vehicles"],
  });

  const form = useForm({
    resolver: zodResolver(addVehicleSchema),
    defaultValues: {
      registration: "",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      type: "light_vehicle",
      currentMileage: 0,
      axleCount: 2,
    },
  });

  useEffect(() => {
    if (editingVehicle) {
      form.reset({
        registration: editingVehicle.registration,
        make: editingVehicle.make,
        model: editingVehicle.model,
        year: editingVehicle.year ?? undefined,
        type: editingVehicle.type,
        currentMileage: editingVehicle.currentMileage ?? 0,
        axleCount: editingVehicle.axleCount ?? 2,
      });
    } else {
      form.reset({
        registration: "",
        make: "",
        model: "",
        year: new Date().getFullYear(),
        type: "light_vehicle",
        currentMileage: 0,
        axleCount: 2,
      });
    }
  }, [editingVehicle, form]);

  const vehicleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addVehicleSchema>) => {
      const method = editingVehicle ? "PATCH" : "POST";
      const url = editingVehicle 
        ? `/api/fleets/${fleetId}/vehicles/${editingVehicle.id}`
        : `/api/fleets/${fleetId}/vehicles`;
      const res = await apiRequest(method, url, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets", fleetId, "vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setModalOpen(false);
      setEditingVehicle(null);
      form.reset();
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      await apiRequest("DELETE", `/api/fleets/${fleetId}/vehicles/${vehicleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets", fleetId, "vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const batchMutation = useMutation({
    mutationFn: async (data: Record<string, any>[]) => {
      const res = await apiRequest("POST", `/api/fleets/${fleetId}/vehicles/batch`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets", fleetId, "vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setBatchOpen(false);
    },
  });

  const onSubmit = form.handleSubmit((d) => vehicleMutation.mutate(d));

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setModalOpen(true);
  };

  const rows = (vehicles ?? []).map((v) => ({
    id: v.id,
    registration: v.registration,
    makeModel: `${v.make} ${v.model}`,
    type: v.type,
    year: v.year ?? "—",
    mileage: `${(v.currentMileage ?? 0).toLocaleString()} km`,
    axleCount: v.axleCount,
    actions: "",
  }));

  return (
    <div>
      <div className="tc-page-header">
        <div>
          <h1 data-testid="text-page-title">Vehicles</h1>
          <p>Manage your fleet vehicles</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button kind="tertiary" renderIcon={Upload} onClick={() => setBatchOpen(true)} data-testid="button-batch-upload-vehicles">
            Batch Upload
          </Button>
          <Button kind="primary" renderIcon={Add} onClick={() => { setEditingVehicle(null); setModalOpen(true); }} data-testid="button-add-vehicle">
            Add Vehicle
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Tile>
          <SkeletonText paragraph lineCount={5} />
        </Tile>
      ) : vehicles && vehicles.length > 0 ? (
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
                  const vehicle = vehicles.find((v) => v.id === row.id);
                  return (
                    <TableRow 
                      {...getRowProps({ row })} 
                      key={row.id} 
                      data-testid={`row-vehicle-${row.id}`}
                      onDoubleClick={() => vehicle && handleEdit(vehicle)}
                      style={{ cursor: "pointer" }}
                    >
                      {row.cells.map((cell: any) => {
                        if (cell.info.header === "type") {
                          return (
                            <TableCell key={cell.id}>
                              <Tag size="sm" type="gray">{cell.value}</Tag>
                            </TableCell>
                          );
                        }
                        if (cell.info.header === "actions") {
                          return (
                            <TableCell key={cell.id}>
                              <div style={{ display: "flex", gap: "0.25rem" }} onClick={(e) => e.stopPropagation()}>
                                <Button
                                  kind="ghost"
                                  size="sm"
                                  hasIconOnly
                                  renderIcon={View}
                                  iconDescription="View vehicle"
                                  onClick={() => navigate(`/fleet/${fleetId}/vehicles/${row.id}`)}
                                  data-testid={`button-view-vehicle-${row.id}`}
                                />
                                <Button
                                  kind="ghost"
                                  size="sm"
                                  hasIconOnly
                                  renderIcon={Edit}
                                  iconDescription="Edit"
                                  onClick={() => vehicle && handleEdit(vehicle)}
                                  data-testid={`button-edit-vehicle-${row.id}`}
                                />
                                <Button
                                  kind="ghost"
                                  size="sm"
                                  hasIconOnly
                                  renderIcon={TrashCan}
                                  iconDescription="Delete"
                                  onClick={() => deleteVehicleMutation.mutate(row.id)}
                                  data-testid={`button-delete-vehicle-${row.id}`}
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
          <Van size={32} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
          <h3>No vehicles yet</h3>
          <p>Add your first vehicle to this fleet.</p>
          <Button kind="primary" renderIcon={Add} onClick={() => { setEditingVehicle(null); setModalOpen(true); }} data-testid="button-add-vehicle-empty">
            Add Vehicle
          </Button>
        </Tile>
      )}

      <Modal
        open={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        onRequestSubmit={onSubmit}
        modalHeading={editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
        primaryButtonText={vehicleMutation.isPending ? (editingVehicle ? "Saving..." : "Adding...") : (editingVehicle ? "Save Changes" : "Add Vehicle")}
        secondaryButtonText="Cancel"
        primaryButtonDisabled={vehicleMutation.isPending}
        data-testid="modal-vehicle"
      >
        <div style={{ marginBottom: "1rem" }}>
          <TextInput
            id="vehicle-registration"
            labelText="Registration"
            placeholder="e.g. AB12 CDE"
            value={form.watch("registration")}
            onChange={(e: any) => form.setValue("registration", e.target.value)}
            invalid={!!form.formState.errors.registration}
            invalidText={form.formState.errors.registration?.message}
            data-testid="input-vehicle-reg"
          />
        </div>
        <div className="tc-form-row tc-form-row-2">
          <TextInput
            id="vehicle-make"
            labelText="Make"
            placeholder="e.g. Volvo"
            value={form.watch("make")}
            onChange={(e: any) => form.setValue("make", e.target.value)}
            invalid={!!form.formState.errors.make}
            invalidText={form.formState.errors.make?.message}
            data-testid="input-vehicle-make"
          />
          <TextInput
            id="vehicle-model"
            labelText="Model"
            placeholder="e.g. FH16"
            value={form.watch("model")}
            onChange={(e: any) => form.setValue("model", e.target.value)}
            invalid={!!form.formState.errors.model}
            invalidText={form.formState.errors.model?.message}
            data-testid="input-vehicle-model"
          />
        </div>
        <div className="tc-form-row tc-form-row-3">
          <NumberInput
            id="vehicle-year"
            label="Year"
            min={1990}
            max={2030}
            value={form.watch("year") ?? new Date().getFullYear()}
            onChange={(_e: any, { value }: any) => form.setValue("year", value)}
            data-testid="input-vehicle-year"
          />
          <Select
            id="vehicle-type"
            labelText="Type"
            value={form.watch("type")}
            onChange={(e: any) => form.setValue("type", e.target.value)}
            data-testid="select-vehicle-type"
          >
            <SelectItem value="light_vehicle" text="Light Vehicle (Car/SUV)" />
            <SelectItem value="service_vehicle" text="Service Vehicle (Van/Pickup)" />
            <SelectItem value="truck" text="Truck" />
            <SelectItem value="dump_truck" text="Dump Truck" />
            <SelectItem value="bus" text="Bus" />
            <SelectItem value="trailer" text="Trailer" />
          </Select>
          <NumberInput
            id="vehicle-axles"
            label="Axles"
            min={1}
            max={10}
            value={form.watch("axleCount")}
            onChange={(_e: any, { value }: any) => form.setValue("axleCount", value)}
            data-testid="input-vehicle-axles"
          />
        </div>
        <div style={{ marginTop: "1rem" }}>
          <NumberInput
            id="vehicle-mileage"
            label="Current Mileage (km)"
            min={0}
            value={form.watch("currentMileage")}
            onChange={(_e: any, { value }: any) => form.setValue("currentMileage", value)}
            data-testid="input-vehicle-mileage"
          />
        </div>
      </Modal>

      <BatchUpload
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        onSubmit={(data) => batchMutation.mutate(data)}
        isPending={batchMutation.isPending}
        entityName="Vehicle"
        fields={vehicleBatchFields}
      />
    </div>
  );
}
