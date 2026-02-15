import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Tyre, Vehicle } from "@shared/schema";
import { Plus, Circle, Trash2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const addTyreSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  size: z.string().min(1, "Size is required"),
  serialNumber: z.string().min(1, "Serial number is required"),
  status: z.enum(["in_use", "in_stock", "worn", "damaged", "disposed", "retreaded"]).default("in_stock"),
  vehicleId: z.string().optional(),
  position: z.enum(["front_left", "front_right", "rear_left", "rear_right", "spare", "inner_left", "inner_right", "outer_left", "outer_right"]).optional(),
  treadDepth: z.coerce.number().min(0).max(20).default(8),
  pressure: z.coerce.number().min(0).max(200).optional(),
  cost: z.coerce.number().min(0).optional(),
});

const statusColors: Record<string, string> = {
  in_use: "bg-chart-3/10 text-chart-3",
  in_stock: "bg-chart-1/10 text-chart-1",
  worn: "bg-chart-4/10 text-chart-4",
  damaged: "bg-destructive/10 text-destructive",
  disposed: "bg-muted text-muted-foreground",
  retreaded: "bg-chart-2/10 text-chart-2",
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
  const color = pct > 50 ? "bg-chart-3" : pct > 25 ? "bg-chart-4" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <Progress value={pct} className="h-2 w-16" />
      <span className="text-xs font-mono">{depth.toFixed(1)}mm</span>
    </div>
  );
}

export default function TyresPage() {
  const { fleetId } = useParams<{ fleetId: string }>();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

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
      toast({ title: "Tyre added" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTyreMutation = useMutation({
    mutationFn: async (tyreId: string) => {
      await apiRequest("DELETE", `/api/fleets/${fleetId}/tyres/${tyreId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets", fleetId, "tyres"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Tyre removed" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">Tyres</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage all fleet tyres</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-tyre">
              <Plus className="w-4 h-4 mr-2" />
              Add Tyre
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Tyre</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => addTyreMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="brand" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl><Input placeholder="e.g. Michelin" {...field} data-testid="input-tyre-brand" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="model" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl><Input placeholder="e.g. X Multi D" {...field} data-testid="input-tyre-model" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="size" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size</FormLabel>
                      <FormControl><Input placeholder="e.g. 315/80R22.5" {...field} data-testid="input-tyre-size" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="serialNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl><Input placeholder="e.g. DOT1234" {...field} data-testid="input-tyre-serial" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={form.control} name="treadDepth" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tread (mm)</FormLabel>
                      <FormControl><Input type="number" step="0.1" {...field} data-testid="input-tyre-tread" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="pressure" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pressure (PSI)</FormLabel>
                      <FormControl><Input type="number" {...field} value={field.value ?? ""} data-testid="input-tyre-pressure" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="cost" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-tyre-cost" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-tyre-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in_stock">In Stock</SelectItem>
                        <SelectItem value="in_use">In Use</SelectItem>
                        <SelectItem value="worn">Worn</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="retreaded">Retreaded</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                {vehicles && vehicles.length > 0 && (
                  <FormField control={form.control} name="vehicleId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Vehicle (optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-tyre-vehicle">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicles.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.registration} - {v.make} {v.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                <Button type="submit" className="w-full" disabled={addTyreMutation.isPending} data-testid="button-submit-tyre">
                  {addTyreMutation.isPending ? "Adding..." : "Add Tyre"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : tyres && tyres.length > 0 ? (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial</TableHead>
                <TableHead>Brand / Model</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tread</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tyres.map((tyre) => (
                <TableRow key={tyre.id} data-testid={`row-tyre-${tyre.id}`}>
                  <TableCell className="font-mono text-sm">{tyre.serialNumber}</TableCell>
                  <TableCell>{tyre.brand} {tyre.model}</TableCell>
                  <TableCell className="font-mono text-sm">{tyre.size}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[tyre.status]}`}>
                      {statusLabels[tyre.status]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <TreadIndicator depth={tyre.treadDepth ?? 0} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tyre.position ? tyre.position.replace(/_/g, " ") : "—"}
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => deleteTyreMutation.mutate(tyre.id)} data-testid={`button-delete-tyre-${tyre.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center mx-auto mb-3">
            <Circle className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-1">No tyres tracked yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Add your first tyre to begin tracking.</p>
          <Button onClick={() => setDialogOpen(true)} data-testid="button-add-tyre-empty">
            <Plus className="w-4 h-4 mr-2" />
            Add Tyre
          </Button>
        </Card>
      )}
    </div>
  );
}
