import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const gameFiles = ["index.html", "style.css", "game.js", "app.js"];

export function publish(env = process.env, run = spawnSync) {
  const { ITCH_IO_KEY, ITCH_IO_TARGET_PATH } = env;
  if (!ITCH_IO_KEY) throw new Error("Set ITCH_IO_KEY before publishing.");
  if (!ITCH_IO_TARGET_PATH || !/^[a-zA-Z0-9_][a-zA-Z0-9_.-]*\/[a-zA-Z0-9_][a-zA-Z0-9_.-]*(?::[a-zA-Z0-9_][a-zA-Z0-9_.-]*)?$/.test(ITCH_IO_TARGET_PATH)) {
    throw new Error("Set ITCH_IO_TARGET_PATH to user/game or user/game:channel.");
  }
  const target = ITCH_IO_TARGET_PATH.includes(":") ? ITCH_IO_TARGET_PATH : `${ITCH_IO_TARGET_PATH}:html5`;
  const staging = mkdtempSync(join(tmpdir(), "blink-beat-"));
  try {
    for (const file of gameFiles) copyFileSync(join(root, file), join(staging, file));
    const result = run("butler", ["push", staging, target], {
      env: { ...env, BUTLER_API_KEY: ITCH_IO_KEY },
      stdio: "inherit"
    });
    if (result.error) throw new Error(`Could not run butler: ${result.error.message}`);
    if (result.status !== 0) throw new Error(`Butler failed${result.status === null ? "" : ` with exit code ${result.status}`}.`);
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    publish();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
