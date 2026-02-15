import {
  fleets, fleetMembers, vehicles, tyres, stockItems, alerts,
  type Fleet, type InsertFleet,
  type FleetMember, type InsertFleetMember,
  type Vehicle, type InsertVehicle,
  type Tyre, type InsertTyre,
  type StockItem, type InsertStockItem,
  type Alert, type InsertAlert,
  users,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getFleetsByUser(userId: string): Promise<Fleet[]>;
  getFleet(id: string): Promise<Fleet | undefined>;
  createFleet(fleet: InsertFleet): Promise<Fleet>;
  deleteFleet(id: string): Promise<void>;

  getFleetMembers(fleetId: string): Promise<any[]>;
  addFleetMember(member: InsertFleetMember): Promise<FleetMember>;
  removeFleetMember(id: string): Promise<void>;
  isFleetMember(fleetId: string, userId: string): Promise<boolean>;

  getVehicles(fleetId: string): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  getVehicleWithTyres(vehicleId: string): Promise<{ vehicle: Vehicle; tyres: Tyre[] } | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  deleteVehicle(id: string): Promise<void>;

  getTyres(fleetId: string): Promise<Tyre[]>;
  getTyre(id: string): Promise<Tyre | undefined>;
  createTyre(tyre: InsertTyre): Promise<Tyre>;
  updateTyre(id: string, data: Partial<InsertTyre>): Promise<Tyre>;
  deleteTyre(id: string): Promise<void>;

  getStockItems(fleetId: string): Promise<StockItem[]>;
  createStockItem(item: InsertStockItem): Promise<StockItem>;
  deleteStockItem(id: string): Promise<void>;

  getAlerts(fleetId: string): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertRead(id: string): Promise<void>;
  markAllAlertsRead(fleetId: string): Promise<void>;

  getStats(userId: string): Promise<{
    totalVehicles: number;
    totalTyres: number;
    activeAlerts: number;
    stockItems: number;
  }>;

  getUserByEmail(email: string): Promise<any | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getFleetsByUser(userId: string): Promise<Fleet[]> {
    const memberOf = await db
      .select({ fleetId: fleetMembers.fleetId })
      .from(fleetMembers)
      .where(eq(fleetMembers.userId, userId));

    const fleetIds = memberOf.map((m) => m.fleetId);
    if (fleetIds.length === 0) return [];

    const result = await db.select().from(fleets);
    return result.filter((f) => fleetIds.includes(f.id));
  }

  async getFleet(id: string): Promise<Fleet | undefined> {
    const [fleet] = await db.select().from(fleets).where(eq(fleets.id, id));
    return fleet || undefined;
  }

  async createFleet(fleet: InsertFleet): Promise<Fleet> {
    const [created] = await db.insert(fleets).values(fleet).returning();
    await db.insert(fleetMembers).values({
      fleetId: created.id,
      userId: fleet.ownerId,
      role: "owner",
    });
    return created;
  }

  async deleteFleet(id: string): Promise<void> {
    await db.delete(alerts).where(eq(alerts.fleetId, id));
    await db.delete(stockItems).where(eq(stockItems.fleetId, id));
    await db.delete(tyres).where(eq(tyres.fleetId, id));
    await db.delete(vehicles).where(eq(vehicles.fleetId, id));
    await db.delete(fleetMembers).where(eq(fleetMembers.fleetId, id));
    await db.delete(fleets).where(eq(fleets.id, id));
  }

  async getFleetMembers(fleetId: string): Promise<any[]> {
    const members = await db
      .select()
      .from(fleetMembers)
      .where(eq(fleetMembers.fleetId, fleetId));

    const memberData = await Promise.all(
      members.map(async (m) => {
        const [user] = await db.select().from(users).where(eq(users.id, m.userId));
        return {
          ...m,
          user: user
            ? {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profileImageUrl: user.profileImageUrl,
              }
            : { id: m.userId, email: null, firstName: null, lastName: null, profileImageUrl: null },
        };
      })
    );
    return memberData;
  }

  async addFleetMember(member: InsertFleetMember): Promise<FleetMember> {
    const [created] = await db.insert(fleetMembers).values(member).returning();
    return created;
  }

  async removeFleetMember(id: string): Promise<void> {
    await db.delete(fleetMembers).where(eq(fleetMembers.id, id));
  }

  async isFleetMember(fleetId: string, userId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(fleetMembers)
      .where(and(eq(fleetMembers.fleetId, fleetId), eq(fleetMembers.userId, userId)));
    return !!member;
  }

  async getVehicles(fleetId: string): Promise<Vehicle[]> {
    return db.select().from(vehicles).where(eq(vehicles.fleetId, fleetId));
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle || undefined;
  }

  async getVehicleWithTyres(vehicleId: string): Promise<{ vehicle: Vehicle; tyres: Tyre[] } | undefined> {
    const vehicle = await this.getVehicle(vehicleId);
    if (!vehicle) return undefined;
    const vehicleTyres = await db.select().from(tyres).where(eq(tyres.vehicleId, vehicleId));
    return { vehicle, tyres: vehicleTyres };
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [created] = await db.insert(vehicles).values(vehicle).returning();
    return created;
  }

  async deleteVehicle(id: string): Promise<void> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }

  async getTyres(fleetId: string): Promise<Tyre[]> {
    return db.select().from(tyres).where(eq(tyres.fleetId, fleetId));
  }

  async getTyre(id: string): Promise<Tyre | undefined> {
    const [tyre] = await db.select().from(tyres).where(eq(tyres.id, id));
    return tyre || undefined;
  }

  async createTyre(tyre: InsertTyre): Promise<Tyre> {
    const [created] = await db.insert(tyres).values(tyre).returning();
    return created;
  }

  async updateTyre(id: string, data: Partial<InsertTyre>): Promise<Tyre> {
    const [updated] = await db.update(tyres).set(data).where(eq(tyres.id, id)).returning();
    return updated;
  }

  async deleteTyre(id: string): Promise<void> {
    await db.delete(tyres).where(eq(tyres.id, id));
  }

  async getStockItems(fleetId: string): Promise<StockItem[]> {
    return db.select().from(stockItems).where(eq(stockItems.fleetId, fleetId));
  }

  async createStockItem(item: InsertStockItem): Promise<StockItem> {
    const [created] = await db.insert(stockItems).values(item).returning();
    return created;
  }

  async deleteStockItem(id: string): Promise<void> {
    await db.delete(stockItems).where(eq(stockItems.id, id));
  }

  async getAlerts(fleetId: string): Promise<Alert[]> {
    return db.select().from(alerts).where(eq(alerts.fleetId, fleetId)).orderBy(desc(alerts.createdAt));
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [created] = await db.insert(alerts).values(alert).returning();
    return created;
  }

  async markAlertRead(id: string): Promise<void> {
    await db.update(alerts).set({ isRead: true }).where(eq(alerts.id, id));
  }

  async markAllAlertsRead(fleetId: string): Promise<void> {
    await db.update(alerts).set({ isRead: true }).where(eq(alerts.fleetId, fleetId));
  }

  async getStats(userId: string): Promise<{
    totalVehicles: number;
    totalTyres: number;
    activeAlerts: number;
    stockItems: number;
  }> {
    const userFleets = await this.getFleetsByUser(userId);
    const fleetIds = userFleets.map((f) => f.id);

    if (fleetIds.length === 0) {
      return { totalVehicles: 0, totalTyres: 0, activeAlerts: 0, stockItems: 0 };
    }

    const allVehicles = await db.select().from(vehicles);
    const allTyres = await db.select().from(tyres);
    const allAlerts = await db.select().from(alerts);
    const allStock = await db.select().from(stockItems);

    return {
      totalVehicles: allVehicles.filter((v) => fleetIds.includes(v.fleetId)).length,
      totalTyres: allTyres.filter((t) => fleetIds.includes(t.fleetId)).length,
      activeAlerts: allAlerts.filter((a) => fleetIds.includes(a.fleetId) && !a.isRead).length,
      stockItems: allStock.filter((s) => fleetIds.includes(s.fleetId)).length,
    };
  }

  async getUserByEmail(email: string): Promise<any | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }
}

export const storage = new DatabaseStorage();
