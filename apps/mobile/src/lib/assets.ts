import { Image, type ImageRef } from "expo-image";
// Metro resolves this bundled file at build time.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const carAsset = require("../../assets/car-studio.png");
let decodedCar: ImageRef | undefined;
export async function preloadCar() {
  decodedCar = await Image.loadAsync(carAsset);
}
export function carSource() {
  return decodedCar ?? carAsset;
}
