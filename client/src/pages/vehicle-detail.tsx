import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button, Tile, Tag, SkeletonText, Loading } from "@carbon/react";
import { ArrowLeft, CircleFilled, WarningAlt } from "@carbon/icons-react";
import type { Vehicle, Tyre } from "@shared/schema";
import { useState } from "react";

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

type VehicleCategory = "light" | "service" | "heavy" | "dump";

function getVehicleCategory(type: string, axleCount: number): VehicleCategory {
  if (type === "dump_truck") return "dump";
  if (type === "truck" || type === "bus") return "heavy";
  if (type === "trailer") return axleCount >= 3 ? "heavy" : "service";
  if (type === "service_vehicle" || type === "van") return "service";
  return "light";
}

interface TyreSlot {
  id: string;
  label: string;
  x: number;
  y: number;
  position: string;
  isDual?: boolean;
}

function generateTyreSlots(category: VehicleCategory, axleCount: number): TyreSlot[] {
  const slots: TyreSlot[] = [];

  const bodyWidth = 200;
  const leftX = 30;
  const rightX = bodyWidth + 50;
  const dualOffset = 22;

  switch (category) {
    case "light": {
      const axleYPositions = [80, 280];
      slots.push({ id: "fl", label: "Front Left", x: leftX, y: axleYPositions[0], position: "front_left" });
      slots.push({ id: "fr", label: "Front Right", x: rightX, y: axleYPositions[0], position: "front_right" });
      slots.push({ id: "rl", label: "Rear Left", x: leftX, y: axleYPositions[1], position: "rear_left" });
      slots.push({ id: "rr", label: "Rear Right", x: rightX, y: axleYPositions[1], position: "rear_right" });
      slots.push({ id: "sp", label: "Spare", x: bodyWidth / 2 + 40, y: 350, position: "spare" });
      break;
    }
    case "service": {
      const axleYPositions = [80, 280];
      slots.push({ id: "fl", label: "Front Left", x: leftX, y: axleYPositions[0], position: "front_left" });
      slots.push({ id: "fr", label: "Front Right", x: rightX, y: axleYPositions[0], position: "front_right" });
      slots.push({ id: "rlo", label: "Rear Left Outer", x: leftX - dualOffset, y: axleYPositions[1], position: "outer_left", isDual: true });
      slots.push({ id: "rli", label: "Rear Left Inner", x: leftX + dualOffset, y: axleYPositions[1], position: "inner_left", isDual: true });
      slots.push({ id: "rri", label: "Rear Right Inner", x: rightX - dualOffset, y: axleYPositions[1], position: "inner_right", isDual: true });
      slots.push({ id: "rro", label: "Rear Right Outer", x: rightX + dualOffset, y: axleYPositions[1], position: "outer_right", isDual: true });
      slots.push({ id: "sp", label: "Spare", x: bodyWidth / 2 + 40, y: 350, position: "spare" });
      break;
    }
    case "heavy": {
      const totalHeight = 100 + (axleCount - 1) * 100;
      const steerY = 80;
      slots.push({ id: "fl", label: "Front Left", x: leftX, y: steerY, position: "front_left" });
      slots.push({ id: "fr", label: "Front Right", x: rightX, y: steerY, position: "front_right" });

      for (let a = 1; a < axleCount; a++) {
        const y = steerY + a * 100;
        const prefix = axleCount > 2 ? `Axle ${a + 1}` : "Rear";
        slots.push({ id: `a${a + 1}lo`, label: `${prefix} Left Outer`, x: leftX - dualOffset, y, position: a === 1 ? "outer_left" : "rear_left", isDual: true });
        slots.push({ id: `a${a + 1}li`, label: `${prefix} Left Inner`, x: leftX + dualOffset, y, position: a === 1 ? "inner_left" : "rear_left", isDual: true });
        slots.push({ id: `a${a + 1}ri`, label: `${prefix} Right Inner`, x: rightX - dualOffset, y, position: a === 1 ? "inner_right" : "rear_right", isDual: true });
        slots.push({ id: `a${a + 1}ro`, label: `${prefix} Right Outer`, x: rightX + dualOffset, y, position: a === 1 ? "outer_right" : "rear_right", isDual: true });
      }
      slots.push({ id: "sp", label: "Spare", x: bodyWidth / 2 + 40, y: steerY + axleCount * 100, position: "spare" });
      break;
    }
    case "dump": {
      const steerY = 80;
      slots.push({ id: "fl", label: "Front Left", x: leftX, y: steerY, position: "front_left" });
      slots.push({ id: "fr", label: "Front Right", x: rightX, y: steerY, position: "front_right" });

      if (axleCount >= 3) {
        slots.push({ id: "a2fl", label: "Axle 2 Left", x: leftX, y: steerY + 80, position: "rear_left" });
        slots.push({ id: "a2fr", label: "Axle 2 Right", x: rightX, y: steerY + 80, position: "rear_right" });
      }

      for (let a = (axleCount >= 3 ? 2 : 1); a < axleCount; a++) {
        const y = steerY + a * 100 + (axleCount >= 3 ? -20 : 0);
        const prefix = `Axle ${a + 1}`;
        slots.push({ id: `a${a + 1}lo`, label: `${prefix} Left Outer`, x: leftX - dualOffset, y, position: "outer_left", isDual: true });
        slots.push({ id: `a${a + 1}li`, label: `${prefix} Left Inner`, x: leftX + dualOffset, y, position: "inner_left", isDual: true });
        slots.push({ id: `a${a + 1}ri`, label: `${prefix} Right Inner`, x: rightX - dualOffset, y, position: "inner_right", isDual: true });
        slots.push({ id: `a${a + 1}ro`, label: `${prefix} Right Outer`, x: rightX + dualOffset, y, position: "outer_right", isDual: true });
      }
      slots.push({ id: "sp", label: "Spare", x: bodyWidth / 2 + 40, y: steerY + axleCount * 100 + 10, position: "spare" });
      break;
    }
  }

  return slots;
}

function getTreadColor(depth: number): string {
  const pct = Math.min(100, (depth / 8) * 100);
  if (pct > 50) return "#198038";
  if (pct > 25) return "#f1c21b";
  return "#da1e28";
}

function VehicleBody({ category, axleCount }: { category: VehicleCategory; axleCount: number }) {
  const x = 55;
  const width = 170;

  switch (category) {
    case "light": {
      return (
        <g>
          <rect x={x} y={40} width={width} height={280} rx={30} ry={30}
            fill="var(--cds-layer-02, #e0e0e0)" stroke="var(--cds-border-strong, #8d8d8d)" strokeWidth={2} opacity={0.4} />
          <rect x={x + 20} y={55} width={width - 40} height={60} rx={8}
            fill="var(--cds-layer-accent-02, #d0d0d0)" opacity={0.3} />
          <rect x={x + 15} y={160} width={width - 30} height={80} rx={8}
            fill="var(--cds-layer-accent-02, #d0d0d0)" opacity={0.3} />
        </g>
      );
    }
    case "service": {
      return (
        <g>
          <rect x={x} y={40} width={width} height={290} rx={20} ry={20}
            fill="var(--cds-layer-02, #e0e0e0)" stroke="var(--cds-border-strong, #8d8d8d)" strokeWidth={2} opacity={0.4} />
          <rect x={x + 15} y={55} width={width - 30} height={55} rx={8}
            fill="var(--cds-layer-accent-02, #d0d0d0)" opacity={0.3} />
          <rect x={x + 10} y={130} width={width - 20} height={170} rx={5}
            fill="var(--cds-layer-accent-02, #d0d0d0)" opacity={0.2} />
        </g>
      );
    }
    case "heavy": {
      const bodyH = 80 + (axleCount - 1) * 100 + 40;
      return (
        <g>
          <rect x={x - 5} y={40} width={width + 10} height={bodyH} rx={12} ry={12}
            fill="var(--cds-layer-02, #e0e0e0)" stroke="var(--cds-border-strong, #8d8d8d)" strokeWidth={2} opacity={0.4} />
          <rect x={x + 10} y={55} width={width - 20} height={50} rx={6}
            fill="var(--cds-layer-accent-02, #d0d0d0)" opacity={0.3} />
          <rect x={x} y={120} width={width} height={bodyH - 100} rx={4}
            fill="var(--cds-layer-accent-02, #d0d0d0)" opacity={0.15} />
        </g>
      );
    }
    case "dump": {
      const bodyH = 80 + (axleCount - 1) * 100 + 40;
      return (
        <g>
          <rect x={x - 5} y={40} width={width + 10} height={bodyH} rx={10} ry={10}
            fill="var(--cds-layer-02, #e0e0e0)" stroke="var(--cds-border-strong, #8d8d8d)" strokeWidth={2} opacity={0.4} />
          <rect x={x + 10} y={55} width={width - 20} height={50} rx={6}
            fill="var(--cds-layer-accent-02, #d0d0d0)" opacity={0.3} />
          <path
            d={`M${x + 5} ${120} L${x + width + 5} ${120} L${x + width - 5} ${bodyH + 20} L${x + 15} ${bodyH + 20} Z`}
            fill="var(--cds-layer-accent-02, #d0d0d0)" opacity={0.2} stroke="var(--cds-border-subtle, #c6c6c6)" strokeWidth={1}
          />
        </g>
      );
    }
  }
}

function TyreSlotSVG({
  slot,
  tyre,
  isSelected,
  onClick,
}: {
  slot: TyreSlot;
  tyre: Tyre | null;
  isSelected: boolean;
  onClick: () => void;
}) {
  const w = slot.isDual ? 16 : 20;
  const h = 34;
  const isSpare = slot.position === "spare";
  const isEmpty = !tyre;

  const treadColor = tyre ? getTreadColor(tyre.treadDepth ?? 8) : "transparent";
  const isWarning = tyre && (tyre.treadDepth ?? 8) < 3;

  return (
    <g
      onClick={onClick}
      style={{ cursor: "pointer" }}
      data-testid={`tyre-slot-${slot.id}`}
    >
      {isSpare ? (
        <>
          <circle
            cx={slot.x}
            cy={slot.y}
            r={18}
            fill={isEmpty ? "var(--cds-layer-02, #e0e0e0)" : treadColor}
            stroke={isSelected ? "#0f62fe" : "var(--cds-border-strong, #8d8d8d)"}
            strokeWidth={isSelected ? 3 : 1.5}
            opacity={isEmpty ? 0.4 : 0.7}
          />
          {isEmpty && (
            <text x={slot.x} y={slot.y + 1} textAnchor="middle" dominantBaseline="middle"
              fontSize={8} fill="var(--cds-text-secondary, #525252)">S</text>
          )}
        </>
      ) : (
        <>
          <rect
            x={slot.x - w / 2}
            y={slot.y - h / 2}
            width={w}
            height={h}
            rx={4}
            fill={isEmpty ? "var(--cds-layer-02, #e0e0e0)" : treadColor}
            stroke={isSelected ? "#0f62fe" : "var(--cds-border-strong, #8d8d8d)"}
            strokeWidth={isSelected ? 3 : 1.5}
            opacity={isEmpty ? 0.4 : 0.7}
          />
          {!isEmpty && (
            <>
              {[0, 1, 2, 3].map((i) => (
                <line
                  key={i}
                  x1={slot.x - w / 2 + 3}
                  y1={slot.y - h / 2 + 6 + i * 7}
                  x2={slot.x + w / 2 - 3}
                  y2={slot.y - h / 2 + 6 + i * 7}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth={1}
                />
              ))}
            </>
          )}
          {isEmpty && (
            <text x={slot.x} y={slot.y + 1} textAnchor="middle" dominantBaseline="middle"
              fontSize={7} fill="var(--cds-text-secondary, #525252)" style={{ fontFamily: "var(--font-mono)" }}>
              {slot.isDual ? "D" : ""}
            </text>
          )}
        </>
      )}

      {isWarning && !isEmpty && (
        <g transform={`translate(${slot.x + (isSpare ? 12 : w / 2)}, ${slot.y - (isSpare ? 12 : h / 2 + 2)})`}>
          <circle cx={0} cy={0} r={6} fill="#da1e28" />
          <text x={0} y={1} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="#fff" fontWeight="bold">!</text>
        </g>
      )}

      {isSelected && (
        <rect
          x={slot.x - (isSpare ? 22 : w / 2 + 4)}
          y={slot.y - (isSpare ? 22 : h / 2 + 4)}
          width={isSpare ? 44 : w + 8}
          height={isSpare ? 44 : h + 8}
          rx={isSpare ? 22 : 6}
          fill="none"
          stroke="#0f62fe"
          strokeWidth={1.5}
          strokeDasharray="3 2"
          opacity={0.6}
        />
      )}
    </g>
  );
}

function AxleLines({ slots, category }: { slots: TyreSlot[]; category: VehicleCategory }) {
  const axles = new Map<number, TyreSlot[]>();
  slots.forEach((s) => {
    if (s.position === "spare") return;
    const key = s.y;
    if (!axles.has(key)) axles.set(key, []);
    axles.get(key)!.push(s);
  });

  return (
    <g>
      {Array.from(axles.entries()).map(([y, axleSlots]) => {
        const minX = Math.min(...axleSlots.map((s) => s.x));
        const maxX = Math.max(...axleSlots.map((s) => s.x));
        return (
          <line
            key={y}
            x1={minX}
            y1={y}
            x2={maxX}
            y2={y}
            stroke="var(--cds-border-subtle, #c6c6c6)"
            strokeWidth={2}
            strokeDasharray="4 3"
            opacity={0.5}
          />
        );
      })}
    </g>
  );
}

function TyreDetailPanel({ tyre, slot }: { tyre: Tyre | null; slot: TyreSlot }) {
  if (!tyre) {
    return (
      <Tile style={{ marginTop: "1rem" }} data-testid="panel-tyre-detail">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <CircleFilled size={16} style={{ opacity: 0.3 }} />
          <h4 style={{ margin: 0, fontWeight: 500 }}>{slot.label}</h4>
        </div>
        <p style={{ opacity: 0.6, margin: 0 }}>No tyre fitted in this position</p>
      </Tile>
    );
  }

  const treadPct = Math.min(100, ((tyre.treadDepth ?? 8) / 8) * 100);
  const treadColor = getTreadColor(tyre.treadDepth ?? 8);

  return (
    <Tile style={{ marginTop: "1rem" }} data-testid="panel-tyre-detail">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CircleFilled size={16} style={{ color: treadColor }} />
          <h4 style={{ margin: 0, fontWeight: 500 }}>{slot.label}</h4>
        </div>
        <Tag size="sm" type={statusTagType[tyre.status] as any}>
          {statusLabels[tyre.status]}
        </Tag>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div>
          <span style={{ fontSize: "0.75rem", opacity: 0.6, display: "block" }}>Brand / Model</span>
          <span style={{ fontWeight: 500 }}>{tyre.brand} {tyre.model}</span>
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", opacity: 0.6, display: "block" }}>Size</span>
          <span style={{ fontWeight: 500 }}>{tyre.size}</span>
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", opacity: 0.6, display: "block" }}>Serial Number</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}>{tyre.serialNumber}</span>
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", opacity: 0.6, display: "block" }}>Tread Depth</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ flex: 1, height: 6, backgroundColor: "var(--cds-border-subtle, #e0e0e0)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${treadPct}%`, height: "100%", backgroundColor: treadColor, borderRadius: 3 }} />
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", fontWeight: 500 }}>
              {(tyre.treadDepth ?? 0).toFixed(1)}mm
            </span>
          </div>
          {(tyre.treadDepth ?? 8) < 3 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem", color: "#da1e28", fontSize: "0.75rem" }}>
              <WarningAlt size={12} />
              <span>Low tread - replacement recommended</span>
            </div>
          )}
        </div>
        {tyre.pressure != null && (
          <div>
            <span style={{ fontSize: "0.75rem", opacity: 0.6, display: "block" }}>Pressure</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{tyre.pressure} PSI</span>
          </div>
        )}
        <div>
          <span style={{ fontSize: "0.75rem", opacity: 0.6, display: "block" }}>Mileage</span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{(tyre.mileage ?? 0).toLocaleString()} km</span>
        </div>
        {tyre.cost != null && (
          <div>
            <span style={{ fontSize: "0.75rem", opacity: 0.6, display: "block" }}>Cost</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>${tyre.cost.toFixed(2)}</span>
          </div>
        )}
      </div>
    </Tile>
  );
}

const vehicleTypeLabels: Record<string, string> = {
  light_vehicle: "Light Vehicle",
  service_vehicle: "Service Vehicle",
  truck: "Truck",
  dump_truck: "Dump Truck",
  bus: "Bus",
  trailer: "Trailer",
  van: "Van",
  car: "Car",
};

function matchTyresToSlots(slots: TyreSlot[], tyres: Tyre[]): Map<string, Tyre | null> {
  const result = new Map<string, Tyre | null>();
  const usedTyres = new Set<string>();

  const positionGroups = new Map<string, TyreSlot[]>();
  slots.forEach((slot) => {
    if (!positionGroups.has(slot.position)) positionGroups.set(slot.position, []);
    positionGroups.get(slot.position)!.push(slot);
  });

  positionGroups.forEach((groupSlots, position) => {
    const matchingTyres = tyres.filter(
      (t) => t.position === position && !usedTyres.has(t.id)
    );
    groupSlots.forEach((slot, idx) => {
      if (idx < matchingTyres.length) {
        result.set(slot.id, matchingTyres[idx]);
        usedTyres.add(matchingTyres[idx].id);
      } else {
        result.set(slot.id, null);
      }
    });
  });

  const unmatchedTyres = tyres.filter((t) => !usedTyres.has(t.id));
  const emptySlots = slots.filter((s) => result.get(s.id) === null && s.position !== "spare");
  unmatchedTyres.forEach((tyre, idx) => {
    if (idx < emptySlots.length) {
      result.set(emptySlots[idx].id, tyre);
      usedTyres.add(tyre.id);
    }
  });

  return result;
}

export default function VehicleDetailPage() {
  const { fleetId, vehicleId } = useParams<{ fleetId: string; vehicleId: string }>();
  const [, navigate] = useLocation();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ vehicle: Vehicle; tyres: Tyre[] }>({
    queryKey: ["/api/fleets", fleetId, "vehicles", vehicleId],
  });

  if (isLoading) {
    return (
      <div>
        <div className="tc-page-header">
          <SkeletonText heading width="40%" />
        </div>
        <Tile>
          <Loading withOverlay={false} description="Loading vehicle..." />
        </Tile>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <div className="tc-page-header">
          <h1>Vehicle not found</h1>
        </div>
        <Button kind="ghost" renderIcon={ArrowLeft} onClick={() => navigate(`/fleet/${fleetId}/vehicles`)}>
          Back to Vehicles
        </Button>
      </div>
    );
  }

  const { vehicle, tyres: vehicleTyres } = data;
  const category = getVehicleCategory(vehicle.type, vehicle.axleCount ?? 2);
  const slots = generateTyreSlots(category, vehicle.axleCount ?? 2);
  const tyreMap = matchTyresToSlots(slots, vehicleTyres);

  const fittedCount = vehicleTyres.filter((t) => t.position && t.position !== "spare").length;
  const totalSlots = slots.filter((s) => s.position !== "spare").length;

  const selectedSlotData = selectedSlot ? slots.find((s) => s.id === selectedSlot) : null;
  const selectedTyre = selectedSlot ? tyreMap.get(selectedSlot) ?? null : null;

  const svgHeight = Math.max(380, 80 + (vehicle.axleCount ?? 2) * 100 + 80);

  return (
    <div>
      <div className="tc-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Button
            kind="ghost"
            size="sm"
            hasIconOnly
            renderIcon={ArrowLeft}
            iconDescription="Back"
            onClick={() => navigate(`/fleet/${fleetId}/vehicles`)}
            data-testid="button-back-vehicles"
          />
          <div>
            <h1 data-testid="text-vehicle-title" style={{ margin: 0 }}>
              {vehicle.registration}
            </h1>
            <p style={{ margin: 0, opacity: 0.7, fontSize: "0.875rem" }}>
              {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ""}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <Tile data-testid="stat-vehicle-type">
          <span style={{ fontSize: "0.75rem", opacity: 0.6, display: "block" }}>Type</span>
          <span style={{ fontWeight: 500 }}>{vehicleTypeLabels[vehicle.type] ?? vehicle.type}</span>
        </Tile>
        <Tile data-testid="stat-vehicle-axles">
          <span style={{ fontSize: "0.75rem", opacity: 0.6, display: "block" }}>Axles</span>
          <span style={{ fontWeight: 500, fontSize: "1.25rem" }}>{vehicle.axleCount ?? 2}</span>
        </Tile>
        <Tile data-testid="stat-vehicle-tyres">
          <span style={{ fontSize: "0.75rem", opacity: 0.6, display: "block" }}>Tyres Fitted</span>
          <span style={{ fontWeight: 500, fontSize: "1.25rem" }}>{fittedCount}/{totalSlots}</span>
        </Tile>
        <Tile data-testid="stat-vehicle-mileage">
          <span style={{ fontSize: "0.75rem", opacity: 0.6, display: "block" }}>Mileage</span>
          <span style={{ fontWeight: 500 }}>{(vehicle.currentMileage ?? 0).toLocaleString()} km</span>
        </Tile>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <Tile data-testid="panel-vehicle-diagram">
          <h3 style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.75rem", opacity: 0.8 }}>
            Top-Down View
          </h3>
          <div style={{ display: "flex", justifyContent: "center", overflow: "auto" }}>
            <svg
              width={320}
              height={svgHeight}
              viewBox={`0 0 320 ${svgHeight}`}
              style={{ maxWidth: "100%" }}
              data-testid="svg-vehicle-topdown"
            >
              <defs>
                <marker id="front-arrow" markerWidth={8} markerHeight={8} refX={4} refY={4} orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="var(--cds-text-secondary, #525252)" opacity={0.4} />
                </marker>
              </defs>

              <line x1={160} y1={10} x2={160} y2={35} stroke="var(--cds-text-secondary, #525252)"
                strokeWidth={1.5} markerEnd="url(#front-arrow)" opacity={0.4} />
              <text x={160} y={8} textAnchor="middle" fontSize={9} fill="var(--cds-text-secondary, #525252)" opacity={0.5}>
                FRONT
              </text>

              <VehicleBody category={category} axleCount={vehicle.axleCount ?? 2} />

              <AxleLines slots={slots} category={category} />

              {slots.map((slot) => (
                <TyreSlotSVG
                  key={slot.id}
                  slot={slot}
                  tyre={tyreMap.get(slot.id) ?? null}
                  isSelected={selectedSlot === slot.id}
                  onClick={() => setSelectedSlot(selectedSlot === slot.id ? null : slot.id)}
                />
              ))}
            </svg>
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.7rem", opacity: 0.7 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#198038" }} />
              <span>Good</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.7rem", opacity: 0.7 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#f1c21b" }} />
              <span>Caution</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.7rem", opacity: 0.7 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#da1e28" }} />
              <span>Replace</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.7rem", opacity: 0.7 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "var(--cds-layer-02, #e0e0e0)", border: "1px solid var(--cds-border-strong, #8d8d8d)" }} />
              <span>Empty</span>
            </div>
          </div>
        </Tile>

        <div>
          <Tile data-testid="panel-tyre-list">
            <h3 style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.75rem", opacity: 0.8 }}>
              Fitted Tyres ({vehicleTyres.length})
            </h3>
            {vehicleTyres.length === 0 ? (
              <p style={{ opacity: 0.5, fontSize: "0.875rem" }}>No tyres fitted to this vehicle</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {vehicleTyres.map((tyre) => {
                  const matchingSlot = slots.find((s) => {
                    const mapped = tyreMap.get(s.id);
                    return mapped?.id === tyre.id;
                  });
                  return (
                    <div
                      key={tyre.id}
                      onClick={() => matchingSlot && setSelectedSlot(matchingSlot.id)}
                      style={{
                        padding: "0.5rem 0.75rem",
                        borderRadius: "4px",
                        backgroundColor: matchingSlot && selectedSlot === matchingSlot.id
                          ? "var(--cds-highlight, rgba(15, 98, 254, 0.1))"
                          : "var(--cds-layer-02, #f4f4f4)",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "background-color 0.15s",
                      }}
                      data-testid={`tyre-item-${tyre.id}`}
                    >
                      <div>
                        <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{tyre.brand} {tyre.model}</div>
                        <div style={{ fontSize: "0.75rem", opacity: 0.6, fontFamily: "var(--font-mono)" }}>
                          {tyre.serialNumber} - {tyre.position ? tyre.position.replace(/_/g, " ") : "unassigned"}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%",
                          backgroundColor: getTreadColor(tyre.treadDepth ?? 8)
                        }} />
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                          {(tyre.treadDepth ?? 0).toFixed(1)}mm
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Tile>

          {selectedSlotData && (
            <TyreDetailPanel tyre={selectedTyre} slot={selectedSlotData} />
          )}
        </div>
      </div>
    </div>
  );
}
