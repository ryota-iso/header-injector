import { copyFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(dirname, "..");
const viteConfigFile = path.resolve(rootDir, "vite.config.ts");

const target = process.argv[2] ?? "all";
const targets = target === "all" ? ["chrome", "safari"] : [target];

await cleanupLegacyDistArtifacts();

for (const buildTarget of targets) {
  assertBuildTarget(buildTarget);
  await buildTargetBundle(buildTarget);
}

async function buildTargetBundle(buildTarget) {
  const outDir = path.resolve(rootDir, "dist", buildTarget);

  await build({
    root: rootDir,
    configFile: viteConfigFile,
    mode: buildTarget,
    build: {
      outDir,
      emptyOutDir: true,
    },
  });

  await build({
    root: rootDir,
    configFile: viteConfigFile,
    mode: buildTarget,
    publicDir: false,
    build: {
      outDir,
      emptyOutDir: false,
      lib: {
        entry: path.resolve(rootDir, "background/main.ts"),
        formats: [buildTarget === "safari" ? "iife" : "es"],
        fileName: () => "background.js",
        name: buildTarget === "safari" ? "HeaderInjectorBackground" : undefined,
      },
    },
  });

  await copyFile(path.resolve(rootDir, `manifest.${buildTarget}.json`), path.resolve(outDir, "manifest.json"));
}

function assertBuildTarget(buildTarget) {
  if (buildTarget !== "chrome" && buildTarget !== "safari") {
    throw new Error(`Unsupported build target: ${buildTarget}`);
  }
}

async function cleanupLegacyDistArtifacts() {
  const distDir = path.resolve(rootDir, "dist");

  await Promise.all([
    rm(path.resolve(distDir, "assets"), { force: true, recursive: true }),
    rm(path.resolve(distDir, "icons"), { force: true, recursive: true }),
    rm(path.resolve(distDir, "index.html"), { force: true, recursive: true }),
    rm(path.resolve(distDir, "background.js"), { force: true, recursive: true }),
    rm(path.resolve(distDir, "manifest.json"), { force: true, recursive: true }),
  ]);
}
