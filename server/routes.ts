import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { z } from "zod";

const createFleetSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
});

const createVehicleSchema = z.object({
  registration: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().min(1990).max(2030).nullable().optional(),
  type: z.string().min(1),
  currentMileage: z.number().min(0).default(0),
  axleCount: z.number().min(1).max(10).default(2),
});

const createTyreSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  size: z.string().min(1),
  serialNumber: z.string().min(1),
  status: z.enum(["in_use", "in_stock", "worn", "damaged", "disposed", "retreaded"]).default("in_stock"),
  vehicleId: z.string().nullable().optional(),
  position: z.enum(["front_left", "front_right", "rear_left", "rear_right", "spare", "inner_left", "inner_right", "outer_left", "outer_right"]).nullable().optional(),
  treadDepth: z.number().min(0).max(20).default(8),
  pressure: z.number().min(0).max(200).nullable().optional(),
  cost: z.number().min(0).nullable().optional(),
  mileage: z.number().min(0).default(0).optional(),
});

const createStockSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  size: z.string().min(1),
  quantity: z.number().min(0).default(0),
  minQuantity: z.number().min(0).default(2),
  unitCost: z.number().min(0).nullable().optional(),
  location: z.string().nullable().optional(),
});

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const stats = await storage.getStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/fleets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const fleetsList = await storage.getFleetsByUser(userId);
      res.json(fleetsList);
    } catch (error) {
      console.error("Error fetching fleets:", error);
      res.status(500).json({ message: "Failed to fetch fleets" });
    }
  });

  app.post("/api/fleets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const parsed = createFleetSchema.parse(req.body);
      const fleet = await storage.createFleet({
        name: parsed.name,
        description: parsed.description || null,
        ownerId: userId,
      });
      res.json(fleet);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating fleet:", error);
      res.status(500).json({ message: "Failed to create fleet" });
    }
  });

  app.delete("/api/fleets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const fleet = await storage.getFleet(req.params.id);
      if (!fleet || fleet.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      await storage.deleteFleet(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting fleet:", error);
      res.status(500).json({ message: "Failed to delete fleet" });
    }
  });

  // Vehicles
  app.get("/api/fleets/:fleetId/vehicles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
      const vehiclesList = await storage.getVehicles(req.params.fleetId);
      res.json(vehiclesList);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.post("/api/fleets/:fleetId/vehicles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
      const parsed = createVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle({
        ...parsed,
        fleetId: req.params.fleetId,
      });
      res.json(vehicle);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating vehicle:", error);
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  app.post("/api/fleets/:fleetId/vehicles/batch", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
      if (!Array.isArray(req.body) || req.body.length === 0) {
        return res.status(400).json({ message: "Request body must be a non-empty array" });
      }
      const validItems: any[] = [];
      const errors: { index: number; errors: any }[] = [];
      req.body.forEach((item: any, idx: number) => {
        const result = createVehicleSchema.safeParse(item);
        if (result.success) {
          validItems.push({ ...result.data, fleetId: req.params.fleetId });
        } else {
          errors.push({ index: idx, errors: result.error.errors });
        }
      });
      if (validItems.length === 0) {
        return res.status(400).json({ message: "No valid items in batch", errors });
      }
      const created = await storage.createVehiclesBatch(validItems);
      res.json({ created, skipped: errors.length });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error batch creating vehicles:", error);
      res.status(500).json({ message: "Failed to batch create vehicles" });
    }
  });

  app.get("/api/fleets/:fleetId/vehicles/:vehicleId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
      const result = await storage.getVehicleWithTyres(req.params.vehicleId);
      if (!result) return res.status(404).json({ message: "Vehicle not found" });
      if (result.vehicle.fleetId !== req.params.fleetId) {
        return res.status(403).json({ message: "Vehicle does not belong to this fleet" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      res.status(500).json({ message: "Failed to fetch vehicle" });
    }
  });

  app.patch("/api/fleets/:fleetId/vehicles/:vehicleId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
      const existing = await storage.getVehicle(req.params.vehicleId);
      if (!existing || existing.fleetId !== req.params.fleetId) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      const updateSchema = createVehicleSchema.partial();
      const parsed = updateSchema.parse(req.body);
      const vehicle = await storage.updateVehicle(req.params.vehicleId, parsed);
      res.json(vehicle);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating vehicle:", error);
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  app.delete("/api/fleets/:fleetId/vehicles/:vehicleId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
      await storage.deleteVehicle(req.params.vehicleId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  // Tyres
  app.get("/api/fleets/:fleetId/tyres", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
      const tyresList = await storage.getTyres(req.params.fleetId);
      res.json(tyresList);
    } catch (error) {
      console.error("Error fetching tyres:", error);
      res.status(500).json({ message: "Failed to fetch tyres" });
    }
  });

  app.post("/api/fleets/:fleetId/tyres/batch", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
      if (!Array.isArray(req.body) || req.body.length === 0) {
        return res.status(400).json({ message: "Request body must be a non-empty array" });
      }
      const validItems: any[] = [];
      const errors: { index: number; errors: any }[] = [];
      req.body.forEach((item: any, idx: number) => {
        const result = createTyreSchema.safeParse(item);
        if (result.success) {
          validItems.push({ ...result.data, fleetId: req.params.fleetId });
        } else {
          errors.push({ index: idx, errors: result.error.errors });
        }
      });
      if (validItems.length === 0) {
        return res.status(400).json({ message: "No valid items in batch", errors });
      }
      const created = await storage.createTyresBatch(validItems);
      res.json({ created, skipped: errors.length });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error batch creating tyres:", error);
      res.status(500).json({ message: "Failed to batch create tyres" });
    }
  });

  app.post("/api/fleets/:fleetId/tyres", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
      const parsed = createTyreSchema.parse(req.body);
      const tyre = await storage.createTyre({
        ...parsed,
        fleetId: req.params.fleetId,
      });
      res.json(tyre);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating tyre:", error);
      res.status(500).json({ message: "Failed to create tyre" });
    }
  });

  app.patch("/api/fleets/:fleetId/tyres/:tyreId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
      const existing = await storage.getTyre(req.params.tyreId);
      if (!existing || existing.fleetId !== req.params.fleetId) {
        return res.status(404).json({ message: "Tyre not found" });
      }
      const updateSchema = createTyreSchema.partial();
      const parsed = updateSchema.parse(req.body);
      const tyre = await storage.updateTyre(req.params.tyreId, parsed);
      res.json(tyre);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating tyre:", error);
      res.status(500).json({ message: "Failed to update tyre" });
    }
  });

  app.delete("/api/fleets/:fleetId/tyres/:tyreId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
      const existing = await storage.getTyre(req.params.tyreId);
      if (!existing || existing.fleetId !== req.params.fleetId) {
        return res.status(404).json({ message: "Tyre not found" });
      }
      await storage.deleteTyre(req.params.tyreId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting tyre:", error);
      res.status(500).json({ message: "Failed to delete tyre" });
    }
  });

  // Stock
  app.get("/api/fleets/:fleetId/stock", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
      const items = await storage.getStockItems(req.params.fleetId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching stock:", error);
      res.status(500).json({ message: "Failed to fetch stock" });
    }
  });

  app.post("/api/fleets/:fleetId/stock", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
      const parsed = createStockSchema.parse(req.body);
      const item = await storage.createStockItem({
        ...parsed,
        fleetId: req.params.fleetId,
      });
      res.json(item);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating stock item:", error);
      res.status(500).json({ message: "Failed to create stock item" });
    }
  });

  app.delete("/api/fleets/:fleetId/stock/:stockId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
      await storage.deleteStockItem(req.params.stockId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting stock item:", error);
      res.status(500).json({ message: "Failed to delete stock item" });
    }
  });

  // Alerts
  app.get("/api/fleets/:fleetId/alerts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
      const alertsList = await storage.getAlerts(req.params.fleetId);
      res.json(alertsList);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.patch("/api/fleets/:fleetId/alerts/mark-all-read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
      await storage.markAllAlertsRead(req.params.fleetId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all alerts read:", error);
      res.status(500).json({ message: "Failed to mark all alerts read" });
    }
  });

  app.patch("/api/fleets/:fleetId/alerts/:alertId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
      await storage.markAlertRead(req.params.alertId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking alert read:", error);
      res.status(500).json({ message: "Failed to mark alert read" });
    }
  });

  // Members
  app.get("/api/fleets/:fleetId/members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
      const members = await storage.getFleetMembers(req.params.fleetId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.post("/api/fleets/:fleetId/members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });

      const parsed = addMemberSchema.parse(req.body);
      const user = await storage.getUserByEmail(parsed.email);
      if (!user) {
        return res.status(404).json({ message: "User not found. They must have an account first." });
      }

      const alreadyMember = await storage.isFleetMember(req.params.fleetId, user.id);
      if (alreadyMember) {
        return res.status(400).json({ message: "User is already a member of this fleet" });
      }

      const member = await storage.addFleetMember({
        fleetId: req.params.fleetId,
        userId: user.id,
        role: parsed.role,
      });
      res.json(member);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error adding member:", error);
      res.status(500).json({ message: "Failed to add member" });
    }
  });

  app.delete("/api/fleets/:fleetId/members/:memberId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isMember = await storage.isFleetMember(req.params.fleetId, userId);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
      await storage.removeFleetMember(req.params.memberId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing member:", error);
      res.status(500).json({ message: "Failed to remove member" });
    }
  });

  return httpServer;
}
