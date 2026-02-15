export interface PositionOption {
  value: string;
  label: string;
}

type VehicleCategory = "light" | "service" | "heavy" | "dump";

function getVehicleCategory(type: string, axleCount: number): VehicleCategory {
  if (type === "dump_truck") return "dump";
  if (type === "truck" || type === "bus") return "heavy";
  if (type === "trailer") return axleCount >= 3 ? "heavy" : "service";
  if (type === "service_vehicle" || type === "van") return "service";
  return "light";
}

export function getPositionOptionsForVehicle(
  vehicleType: string,
  axleCount: number
): PositionOption[] {
  const category = getVehicleCategory(vehicleType, axleCount);

  switch (category) {
    case "light":
      return [
        { value: "front_left", label: "Front Left" },
        { value: "front_right", label: "Front Right" },
        { value: "rear_left", label: "Rear Left" },
        { value: "rear_right", label: "Rear Right" },
        { value: "spare", label: "Spare" },
      ];
    case "service":
      return [
        { value: "front_left", label: "Front Left" },
        { value: "front_right", label: "Front Right" },
        { value: "outer_left", label: "Rear Left Outer" },
        { value: "inner_left", label: "Rear Left Inner" },
        { value: "inner_right", label: "Rear Right Inner" },
        { value: "outer_right", label: "Rear Right Outer" },
        { value: "spare", label: "Spare" },
      ];
    case "heavy": {
      const options: PositionOption[] = [
        { value: "front_left", label: "Front Left" },
        { value: "front_right", label: "Front Right" },
      ];
      for (let a = 1; a < axleCount; a++) {
        const prefix = axleCount > 2 ? `Axle ${a + 1}` : "Rear";
        options.push(
          { value: "outer_left", label: `${prefix} Left Outer` },
          { value: "inner_left", label: `${prefix} Left Inner` },
          { value: "inner_right", label: `${prefix} Right Inner` },
          { value: "outer_right", label: `${prefix} Right Outer` },
        );
      }
      options.push({ value: "spare", label: "Spare" });
      return options;
    }
    case "dump": {
      const options: PositionOption[] = [
        { value: "front_left", label: "Front Left" },
        { value: "front_right", label: "Front Right" },
      ];
      if (axleCount >= 3) {
        options.push(
          { value: "rear_left", label: "Axle 2 Left" },
          { value: "rear_right", label: "Axle 2 Right" },
        );
      }
      for (let a = (axleCount >= 3 ? 2 : 1); a < axleCount; a++) {
        const prefix = `Axle ${a + 1}`;
        options.push(
          { value: "outer_left", label: `${prefix} Left Outer` },
          { value: "inner_left", label: `${prefix} Left Inner` },
          { value: "inner_right", label: `${prefix} Right Inner` },
          { value: "outer_right", label: `${prefix} Right Outer` },
        );
      }
      options.push({ value: "spare", label: "Spare" });
      return options;
    }
  }
}

export const positionLabels: Record<string, string> = {
  front_left: "Front Left",
  front_right: "Front Right",
  rear_left: "Rear Left",
  rear_right: "Rear Right",
  spare: "Spare",
  inner_left: "Inner Left",
  inner_right: "Inner Right",
  outer_left: "Outer Left",
  outer_right: "Outer Right",
};
