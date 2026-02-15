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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Vehicle, Tyre } from "@shared/schema";
import { Plus, Truck, Trash2, Circle } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const addVehicleSchema = z.object({
  registration: z.string().min(1, "Registration is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().min(1990).max(2030).optional(),
  type: z.string().min(1, "Vehicle type is required"),
  currentMileage: z.coerce.number().min(0).default(0),
  axleCount: z.coerce.number().min(1).max(10).default(2),
});

export default function VehiclesPage() {
  const { fleetId } = useParams<{ fleetId: string }>();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

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
      type: "truck",
      currentMileage: 0,
      axleCount: 2,
    },
  });

  const addVehicleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addVehicleSchema>) => {
      const res = await apiRequest("POST", `/api/fleets/${fleetId}/vehicles`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets", fleetId, "vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Vehicle added" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      await apiRequest("DELETE", `/api/fleets/${fleetId}/vehicles/${vehicleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets", fleetId, "vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Vehicle removed" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">Vehicles</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your fleet vehicles</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-vehicle">
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Vehicle</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => addVehicleMutation.mutate(d))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="registration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. AB12 CDE" {...field} data-testid="input-vehicle-reg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Volvo" {...field} data-testid="input-vehicle-make" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. FH16" {...field} data-testid="input-vehicle-model" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-vehicle-year" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-vehicle-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="truck">Truck</SelectItem>
                            <SelectItem value="van">Van</SelectItem>
                            <SelectItem value="bus">Bus</SelectItem>
                            <SelectItem value="trailer">Trailer</SelectItem>
                            <SelectItem value="car">Car</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="axleCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Axles</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={10} {...field} data-testid="input-vehicle-axles" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="currentMileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Mileage (km)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-vehicle-mileage" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={addVehicleMutation.isPending} data-testid="button-submit-vehicle">
                  {addVehicleMutation.isPending ? "Adding..." : "Add Vehicle"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card className="p-0">
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      ) : vehicles && vehicles.length > 0 ? (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Registration</TableHead>
                <TableHead>Make / Model</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Mileage</TableHead>
                <TableHead className="text-right">Axles</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id} data-testid={`row-vehicle-${vehicle.id}`}>
                  <TableCell className="font-medium">{vehicle.registration}</TableCell>
                  <TableCell>
                    {vehicle.make} {vehicle.model}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{vehicle.type}</Badge>
                  </TableCell>
                  <TableCell>{vehicle.year ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {(vehicle.currentMileage ?? 0).toLocaleString()} km
                  </TableCell>
                  <TableCell className="text-right">{vehicle.axleCount}</TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteVehicleMutation.mutate(vehicle.id)}
                      data-testid={`button-delete-vehicle-${vehicle.id}`}
                    >
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
            <Truck className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-1">No vehicles yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Add your first vehicle to this fleet.</p>
          <Button onClick={() => setDialogOpen(true)} data-testid="button-add-vehicle-empty">
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </Card>
      )}
    </div>
  );
}
