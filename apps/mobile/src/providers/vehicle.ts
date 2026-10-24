import type { TelemetrySource } from "@convoy/domain";
export interface VehicleSnapshot {
  source: TelemetrySource;
  level: number | null;
  sampledAt: number;
  rangeKm: null;
}
export interface VehicleDataProvider {
  readonly source: TelemetrySource;
  read(): Promise<VehicleSnapshot>;
}
export class ManualVehicleProvider implements VehicleDataProvider {
  readonly source = "manual" as const;
  constructor(private level: number | null) {}
  async read(): Promise<VehicleSnapshot> {
    return {
      source: this.source,
      level: this.level,
      sampledAt: Date.now(),
      rangeKm: null,
    };
  }
}
export class DemoVehicleProvider implements VehicleDataProvider {
  readonly source = "demo" as const;
  async read(): Promise<VehicleSnapshot> {
    return {
      source: this.source,
      level: 23,
      sampledAt: Date.now(),
      rangeKm: null,
    };
  }
}
/** Future authorized AAOS bridge implements this contract in an AAOS-specific package. No Pleos SDK is loaded here. */
