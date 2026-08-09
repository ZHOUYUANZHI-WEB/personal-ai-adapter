import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import test from "node:test";

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = path.join(repositoryRoot, "dist", "cli.js");

async function expectedVersion() {
  const packageData = JSON.parse(await fs.readFile(path.join(repositoryRoot, "package.json"), "utf8"));
  return packageData.version;
}

test("--version matches package.json", async () => {
  const { stdout } = await execFileAsync(process.execPath, [cliPath, "--version"], { cwd: repositoryRoot });
  assert.equal(stdout.trim(), await expectedVersion());
});

test("help banner uses the package version", async () => {
  const { stdout } = await execFileAsync(process.execPath, [cliPath, "--help"], { cwd: repositoryRoot });
  assert.match(stdout, new RegExp(`Personal AI Adapter v${await expectedVersion()}`));
});
