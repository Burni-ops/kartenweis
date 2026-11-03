import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const pkg = JSON.parse(
  readFileSync(path.join(root, "package.json"), "utf8"),
);
const [major = 0, minor = 0, patch = 0] = String(pkg.version)
  .split(".")
  .map((part) => Number.parseInt(part, 10) || 0);
const versionCode = major * 10000 + minor * 100 + patch;

const isWindows = process.platform === "win32";
const command = isWindows ? "gradlew.bat" : "./gradlew";
const args = [
  "assembleDebug",
  `-PversionCode=${versionCode}`,
  `-PversionName=${pkg.version}`,
];

const result = spawnSync(command, args, {
  cwd: path.join(root, "android"),
  stdio: "inherit",
  shell: isWindows,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
