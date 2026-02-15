import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StockItem } from "@shared/schema";
import { Plus, Package, Trash2, AlertTriangle } from "lucide-react";
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

export default function StockPage() {
  const { fleetId } = useParams<{ fleetId: string }>();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

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
      toast({ title: "Stock item added" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteStockMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/fleets/${fleetId}/stock/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets", fleetId, "stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Stock item removed" });
    },
  });

  const lowStockCount = stockItems?.filter((s) => s.quantity <= (s.minQuantity ?? 2)).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">Stock</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your tyre inventory</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-stock">
              <Plus className="w-4 h-4 mr-2" />
              Add Stock Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Stock Item</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => addStockMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="brand" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl><Input placeholder="e.g. Bridgestone" {...field} data-testid="input-stock-brand" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="model" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl><Input placeholder="e.g. R168" {...field} data-testid="input-stock-model" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="size" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size</FormLabel>
                    <FormControl><Input placeholder="e.g. 385/65R22.5" {...field} data-testid="input-stock-size" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={form.control} name="quantity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl><Input type="number" {...field} data-testid="input-stock-qty" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="minQuantity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Qty</FormLabel>
                      <FormControl><Input type="number" {...field} data-testid="input-stock-min-qty" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="unitCost" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-stock-cost" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Location</FormLabel>
                    <FormControl><Input placeholder="e.g. Warehouse A" {...field} data-testid="input-stock-location" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={addStockMutation.isPending} data-testid="button-submit-stock">
                  {addStockMutation.isPending ? "Adding..." : "Add Stock Item"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {lowStockCount > 0 && (
        <Card className="p-3 bg-chart-4/5 border-chart-4/20">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-chart-4" />
            <span className="font-medium">{lowStockCount} item{lowStockCount > 1 ? "s" : ""} at or below minimum stock level</span>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : stockItems && stockItems.length > 0 ? (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand / Model</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Min Qty</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockItems.map((item) => {
                const isLow = item.quantity <= (item.minQuantity ?? 2);
                return (
                  <TableRow key={item.id} data-testid={`row-stock-${item.id}`}>
                    <TableCell className="font-medium">{item.brand} {item.model}</TableCell>
                    <TableCell className="font-mono text-sm">{item.size}</TableCell>
                    <TableCell className="text-right">
                      <span className={isLow ? "text-destructive font-semibold" : ""}>{item.quantity}</span>
                      {isLow && <AlertTriangle className="w-3 h-3 text-destructive inline ml-1" />}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{item.minQuantity}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {item.unitCost ? `$${item.unitCost.toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.location || "—"}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => deleteStockMutation.mutate(item.id)} data-testid={`button-delete-stock-${item.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-1">No stock items yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Add tyre stock to track your inventory.</p>
          <Button onClick={() => setDialogOpen(true)} data-testid="button-add-stock-empty">
            <Plus className="w-4 h-4 mr-2" />
            Add Stock Item
          </Button>
        </Card>
      )}
    </div>
  );
}
