import type { Stop } from "./index";
/** Illustrative planning fixtures. Coordinates approximate rest areas, services and minutes are unverified. */
export const seedStops: Stop[] = [
  {
    id: "munmak",
    name: "문막휴게소",
    en: "Munmak rest stop",
    region: "원주 · 영동고속도로",
    lat: 37.324,
    lng: 127.8233,
    services: ["charge", "fuel", "food", "rest", "toilet"],
    connectors: ["ccs1"],
    accessible: true,
    detourMinutes: 4,
    corridor: "seoul-gangneung",
    provenance: "illustrative",
  },
  {
    id: "hoengseong",
    name: "횡성휴게소",
    en: "Hoengseong rest stop",
    region: "횡성 · 영동고속도로",
    lat: 37.4777,
    lng: 128.1355,
    services: ["charge", "fuel", "food", "rest", "toilet"],
    connectors: ["ccs1", "chademo"],
    accessible: true,
    detourMinutes: 8,
    corridor: "seoul-gangneung",
    provenance: "illustrative",
  },
  {
    id: "pyeongchang",
    name: "평창휴게소",
    en: "Pyeongchang rest stop",
    region: "평창 · 영동고속도로",
    lat: 37.6226,
    lng: 128.4665,
    services: ["charge", "food", "rest", "toilet"],
    connectors: ["ccs1"],
    accessible: true,
    detourMinutes: 6,
    corridor: "seoul-gangneung",
    provenance: "illustrative",
  },
  {
    id: "yeoju",
    name: "여주휴게소",
    en: "Yeoju rest stop",
    region: "여주 · 영동고속도로",
    lat: 37.2398,
    lng: 127.5699,
    services: ["fuel", "food", "rest", "toilet"],
    connectors: [],
    accessible: false,
    detourMinutes: 2,
    corridor: "seoul-gangneung",
    provenance: "illustrative",
  },
];
export interface StopProvider {
  readonly source: "illustrative" | "live";
  getStops(): Promise<Stop[]>;
}
export class SeedStopProvider implements StopProvider {
  readonly source = "illustrative" as const;
  async getStops() {
    return seedStops;
  }
}
