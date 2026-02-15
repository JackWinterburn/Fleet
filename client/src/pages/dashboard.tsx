import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertFleetSchema } from "@shared/schema";
import type { Fleet, Vehicle, Tyre, Alert } from "@shared/schema";
import {
  Plus,
  Truck,
  Circle,
  AlertTriangle,
  ChevronRight,
  Package,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const createFleetSchema = z.object({
  name: z.string().min(1, "Fleet name is required"),
  description: z.string().optional(),
});

export default function DashboardPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

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
      toast({ title: "Fleet created", description: "Your new fleet is ready." });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your fleet operations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-fleet">
              <Plus className="w-4 h-4 mr-2" />
              New Fleet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Fleet</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => createFleetMutation.mutate(d))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fleet Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. North Region Fleet" {...field} data-testid="input-fleet-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Optional description..." {...field} data-testid="input-fleet-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createFleetMutation.isPending} data-testid="button-submit-fleet">
                  {createFleetMutation.isPending ? "Creating..." : "Create Fleet"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Vehicles", value: stats?.totalVehicles ?? 0, icon: Truck, color: "text-chart-1" },
          { label: "Tyres", value: stats?.totalTyres ?? 0, icon: Circle, color: "text-chart-2" },
          { label: "Active Alerts", value: stats?.activeAlerts ?? 0, icon: AlertTriangle, color: "text-chart-4" },
          { label: "Stock Items", value: stats?.stockItems ?? 0, icon: Package, color: "text-chart-3" },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-semibold mt-2" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
              {fleetsLoading ? <Skeleton className="h-8 w-16" /> : stat.value}
            </p>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Your Fleets</h2>
        {fleetsLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </Card>
            ))}
          </div>
        ) : fleets && fleets.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {fleets.map((fleet) => (
              <Link key={fleet.id} href={`/fleet/${fleet.id}/vehicles`}>
                <Card className="p-4 hover-elevate cursor-pointer" data-testid={`card-fleet-${fleet.id}`}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium truncate">{fleet.name}</h3>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                  {fleet.description && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">{fleet.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="secondary" className="text-xs">Fleet</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center mx-auto mb-3">
              <Truck className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No fleets yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first fleet to start managing your vehicles and tyres.
            </p>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-create-fleet-empty">
              <Plus className="w-4 h-4 mr-2" />
              Create Fleet
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
