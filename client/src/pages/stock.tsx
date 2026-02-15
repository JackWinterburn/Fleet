import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import {
  Button,
  Modal,
  TextInput,
  NumberInput,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Tile,
  InlineNotification,
  SkeletonText,
} from "@carbon/react";
import { Add, TrashCan, Package, WarningAlt } from "@carbon/icons-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { StockItem } from "@shared/schema";
import { useState } from "react";
import { z } from "zod";

const addStockSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  size: z.string().min(1, "Size is required"),
  quantity: z.coerce.number().min(0).default(0),
  minQuantity: z.coerce.number().min(0).default(2),
  unitCost: z.coerce.number().min(0).optional(),
  location: z.string().optional(),
});

const headers = [
  { key: "brandModel", header: "Brand / Model" },
  { key: "size", header: "Size" },
  { key: "quantity", header: "Quantity" },
  { key: "minQuantity", header: "Min Qty" },
  { key: "unitCost", header: "Unit Cost" },
  { key: "location", header: "Location" },
  { key: "actions", header: "" },
];

export default function StockPage() {
  const { fleetId } = useParams<{ fleetId: string }>();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: stockItems, isLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/fleets", fleetId, "stock"],
  });

  const form = useForm({
    resolver: zodResolver(addStockSchema),
    defaultValues: {
      brand: "",
      model: "",
      size: "",
      quantity: 0,
      minQuantity: 2,
      unitCost: undefined,
      location: "",
    },
  });

  const addStockMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addStockSchema>) => {
      const res = await apiRequest("POST", `/api/fleets/${fleetId}/stock`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets", fleetId, "stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setModalOpen(false);
      form.reset();
    },
  });

  const deleteStockMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/fleets/${fleetId}/stock/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets", fleetId, "stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const onSubmit = form.handleSubmit((d) => addStockMutation.mutate(d));

  const lowStockCount = stockItems?.filter((s) => s.quantity <= (s.minQuantity ?? 2)).length ?? 0;

  const rows = (stockItems ?? []).map((item) => ({
    id: item.id,
    brandModel: `${item.brand} ${item.model}`,
    size: item.size,
    quantity: item.quantity,
    minQuantity: item.minQuantity,
    unitCost: item.unitCost ? `$${Number(item.unitCost).toFixed(2)}` : "—",
    location: item.location || "—",
    actions: "",
    _isLow: item.quantity <= (item.minQuantity ?? 2),
  }));

  return (
    <div>
      <div className="tc-page-header">
        <div>
          <h1 data-testid="text-page-title">Stock</h1>
          <p>Manage your tyre inventory</p>
        </div>
        <Button kind="primary" renderIcon={Add} onClick={() => setModalOpen(true)} data-testid="button-add-stock">
          Add Stock Item
        </Button>
      </div>

      {lowStockCount > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <InlineNotification
            kind="warning"
            title="Low stock"
            subtitle={`${lowStockCount} item${lowStockCount > 1 ? "s" : ""} at or below minimum stock level`}
            hideCloseButton
          />
        </div>
      )}

      {isLoading ? (
        <Tile><SkeletonText paragraph lineCount={5} /></Tile>
      ) : stockItems && stockItems.length > 0 ? (
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
                  const item = stockItems.find((s) => s.id === row.id);
                  const isLow = item ? item.quantity <= (item.minQuantity ?? 2) : false;
                  return (
                    <TableRow {...getRowProps({ row })} key={row.id} data-testid={`row-stock-${row.id}`}>
                      {row.cells.map((cell: any) => {
                        if (cell.info.header === "quantity" && isLow) {
                          return (
                            <TableCell key={cell.id}>
                              <span style={{ color: "#da1e28", fontWeight: 600 }}>{cell.value}</span>
                              <WarningAlt size={12} style={{ color: "#da1e28", marginLeft: "0.25rem", verticalAlign: "middle" }} />
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
                                onClick={() => deleteStockMutation.mutate(row.id)}
                                data-testid={`button-delete-stock-${row.id}`}
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
          <Package size={32} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
          <h3>No stock items yet</h3>
          <p>Add tyre stock to track your inventory.</p>
          <Button kind="primary" renderIcon={Add} onClick={() => setModalOpen(true)} data-testid="button-add-stock-empty">
            Add Stock Item
          </Button>
        </Tile>
      )}

      <Modal
        open={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        onRequestSubmit={onSubmit}
        modalHeading="Add Stock Item"
        primaryButtonText={addStockMutation.isPending ? "Adding..." : "Add Stock Item"}
        secondaryButtonText="Cancel"
        primaryButtonDisabled={addStockMutation.isPending}
        data-testid="modal-add-stock"
      >
        <div className="tc-form-row tc-form-row-2">
          <TextInput
            id="stock-brand"
            labelText="Brand"
            placeholder="e.g. Bridgestone"
            value={form.watch("brand")}
            onChange={(e: any) => form.setValue("brand", e.target.value)}
            invalid={!!form.formState.errors.brand}
            invalidText={form.formState.errors.brand?.message}
            data-testid="input-stock-brand"
          />
          <TextInput
            id="stock-model"
            labelText="Model"
            placeholder="e.g. R168"
            value={form.watch("model")}
            onChange={(e: any) => form.setValue("model", e.target.value)}
            invalid={!!form.formState.errors.model}
            invalidText={form.formState.errors.model?.message}
            data-testid="input-stock-model"
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <TextInput
            id="stock-size"
            labelText="Size"
            placeholder="e.g. 385/65R22.5"
            value={form.watch("size")}
            onChange={(e: any) => form.setValue("size", e.target.value)}
            invalid={!!form.formState.errors.size}
            invalidText={form.formState.errors.size?.message}
            data-testid="input-stock-size"
          />
        </div>
        <div className="tc-form-row tc-form-row-3">
          <NumberInput
            id="stock-quantity"
            label="Quantity"
            min={0}
            value={form.watch("quantity")}
            onChange={(_e: any, { value }: any) => form.setValue("quantity", value)}
            data-testid="input-stock-qty"
          />
          <NumberInput
            id="stock-min-qty"
            label="Min Qty"
            min={0}
            value={form.watch("minQuantity")}
            onChange={(_e: any, { value }: any) => form.setValue("minQuantity", value)}
            data-testid="input-stock-min-qty"
          />
          <NumberInput
            id="stock-cost"
            label="Unit Cost"
            min={0}
            step={0.01}
            value={form.watch("unitCost") ?? 0}
            onChange={(_e: any, { value }: any) => form.setValue("unitCost", value || undefined)}
            data-testid="input-stock-cost"
          />
        </div>
        <div style={{ marginTop: "1rem" }}>
          <TextInput
            id="stock-location"
            labelText="Storage Location"
            placeholder="e.g. Warehouse A"
            value={form.watch("location") ?? ""}
            onChange={(e: any) => form.setValue("location", e.target.value)}
            data-testid="input-stock-location"
          />
        </div>
      </Modal>
    </div>
  );
}
