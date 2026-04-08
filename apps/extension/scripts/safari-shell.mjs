import { access, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionRootDir = path.resolve(dirname, "..");
const workspaceRootDir = path.resolve(extensionRootDir, "..", "..");
const safariDistDir = path.resolve(extensionRootDir, "dist", "safari");
const safariShellDir = path.resolve(workspaceRootDir, "apps", "safari-shell");

const command = process.argv[2] ?? "prepare";

await runCommand(command);

async function runCommand(commandName) {
  switch (commandName) {
    case "prepare":
      await runNodeScript(path.resolve(extensionRootDir, "scripts", "build-extension.mjs"), ["safari"]);
      await ensureSafariBuildExists();
      await runConverter({ rebuildProject: false });
      return;
    case "rebuild":
      await ensureSafariBuildExists();
      await runConverter({ rebuildProject: true });
      return;
    default:
      throw new Error(`Unsupported safari shell command: ${commandName}`);
  }
}

async function ensureSafariBuildExists() {
  try {
    await access(path.resolve(safariDistDir, "manifest.json"));
  } catch {
    throw new Error(
      "apps/extension/dist/safari が見つからない。先に `vp run @header-injector/extension#build:safari` を実行すること。",
    );
  }
}

async function runNodeScript(scriptPath, args) {
  await spawnAndWait(process.execPath, [scriptPath, ...args], extensionRootDir);
}

async function runConverter({ rebuildProject }) {
  const converterArgs = ["safari-web-extension-converter", safariDistDir, "--ios-only"];

  if (rebuildProject) {
    converterArgs.push("--rebuild-project", await resolveExistingProjectPath());
  } else {
    converterArgs.push("--project-location", safariShellDir);
  }

  await spawnAndWait("xcrun", converterArgs, workspaceRootDir);
}

async function resolveExistingProjectPath() {
  const projectRootEntries = await readdir(safariShellDir, { withFileTypes: true });

  for (const entry of projectRootEntries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const candidateDir = path.resolve(safariShellDir, entry.name);
    const candidateEntries = await readdir(candidateDir, { withFileTypes: true });
    const projectEntry = candidateEntries.find(
      (nestedEntry) => nestedEntry.isDirectory() && nestedEntry.name.endsWith(".xcodeproj"),
    );

    if (projectEntry) {
      return path.resolve(candidateDir, projectEntry.name);
    }
  }

  throw new Error(
    "既存の Safari shell の .xcodeproj が見つからない。先に `vp run @header-injector/extension#build:safari:ios` を実行すること。",
  );
}

function spawnAndWait(commandName, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(commandName, args, {
      cwd,
      stdio: "inherit",
    });

    child.on("error", (error) => {
      if (error.code === "ENOENT") {
        reject(new Error(`'${commandName}' が見つからない。Xcode Command Line Tools を確認すること。`));
        return;
      }

      reject(error);
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${commandName} ${args.join(" ")} が終了コード ${code} で失敗した。`));
    });
  });
}
