import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, real, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const tyreStatusEnum = pgEnum("tyre_status", [
  "in_use", "in_stock", "worn", "damaged", "disposed", "retreaded"
]);

export const tyrePositionEnum = pgEnum("tyre_position", [
  "front_left", "front_right", "rear_left", "rear_right",
  "spare", "inner_left", "inner_right", "outer_left", "outer_right"
]);

export const alertTypeEnum = pgEnum("alert_type", [
  "low_tread", "rotation_due", "replacement_needed", "low_stock",
  "inspection_due", "pressure_warning", "mileage_threshold"
]);

export const alertSeverityEnum = pgEnum("alert_severity", [
  "info", "warning", "critical"
]);

export const fleetRoleEnum = pgEnum("fleet_role", [
  "owner", "admin", "member"
]);

export const fleets = pgTable("fleets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fleetMembers = pgTable("fleet_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fleetId: varchar("fleet_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: fleetRoleEnum("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fleetId: varchar("fleet_id").notNull(),
  registration: text("registration").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year"),
  type: text("type").notNull(),
  currentMileage: integer("current_mileage").default(0),
  axleCount: integer("axle_count").default(2),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tyres = pgTable("tyres", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fleetId: varchar("fleet_id").notNull(),
  vehicleId: varchar("vehicle_id"),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  size: text("size").notNull(),
  serialNumber: text("serial_number").notNull(),
  status: tyreStatusEnum("status").notNull().default("in_stock"),
  position: tyrePositionEnum("position"),
  treadDepth: real("tread_depth").default(8.0),
  pressure: real("pressure"),
  mileage: integer("mileage").default(0),
  installDate: timestamp("install_date"),
  purchaseDate: timestamp("purchase_date").defaultNow(),
  cost: real("cost"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stockItems = pgTable("stock_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fleetId: varchar("fleet_id").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  size: text("size").notNull(),
  quantity: integer("quantity").notNull().default(0),
  minQuantity: integer("min_quantity").default(2),
  unitCost: real("unit_cost"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fleetId: varchar("fleet_id").notNull(),
  vehicleId: varchar("vehicle_id"),
  tyreId: varchar("tyre_id"),
  type: alertTypeEnum("type").notNull(),
  severity: alertSeverityEnum("severity").notNull().default("info"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fleetsRelations = relations(fleets, ({ many }) => ({
  members: many(fleetMembers),
  vehicles: many(vehicles),
  tyres: many(tyres),
  stockItems: many(stockItems),
  alerts: many(alerts),
}));

export const fleetMembersRelations = relations(fleetMembers, ({ one }) => ({
  fleet: one(fleets, { fields: [fleetMembers.fleetId], references: [fleets.id] }),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  fleet: one(fleets, { fields: [vehicles.fleetId], references: [fleets.id] }),
  tyres: many(tyres),
}));

export const tyresRelations = relations(tyres, ({ one }) => ({
  fleet: one(fleets, { fields: [tyres.fleetId], references: [fleets.id] }),
  vehicle: one(vehicles, { fields: [tyres.vehicleId], references: [vehicles.id] }),
}));

export const stockItemsRelations = relations(stockItems, ({ one }) => ({
  fleet: one(fleets, { fields: [stockItems.fleetId], references: [fleets.id] }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  fleet: one(fleets, { fields: [alerts.fleetId], references: [fleets.id] }),
}));

export const insertFleetSchema = createInsertSchema(fleets).omit({ id: true, createdAt: true });
export const insertFleetMemberSchema = createInsertSchema(fleetMembers).omit({ id: true, joinedAt: true });
export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true, createdAt: true });
export const insertTyreSchema = createInsertSchema(tyres).omit({ id: true, createdAt: true });
export const insertStockItemSchema = createInsertSchema(stockItems).omit({ id: true, createdAt: true });
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, createdAt: true });

export type InsertFleet = z.infer<typeof insertFleetSchema>;
export type Fleet = typeof fleets.$inferSelect;
export type InsertFleetMember = z.infer<typeof insertFleetMemberSchema>;
export type FleetMember = typeof fleetMembers.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertTyre = z.infer<typeof insertTyreSchema>;
export type Tyre = typeof tyres.$inferSelect;
export type InsertStockItem = z.infer<typeof insertStockItemSchema>;
export type StockItem = typeof stockItems.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;
