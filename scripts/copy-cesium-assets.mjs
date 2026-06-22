import { cpSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules/cesium/Build/Cesium");
const dest = join(root, "public/cesium");

if (!existsSync(src)) {
  console.log("Cesium non installato — skip copy assets.");
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("Cesium assets → public/cesium");
