import fs from "node:fs/promises";
import path from "node:path";

const stableIdPattern = /^[a-z0-9][a-z0-9._:-]*$/;

export function objectPath(labPath: string, collection: string, id: string): string {
  if (!stableIdPattern.test(id)) {
    throw new Error(`Invalid object ID: ${id}`);
  }

  return path.join(path.resolve(labPath), collection, `${id}.json`);
}

export async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx"
  });
  await fs.rename(temporaryPath, filePath);
}

export async function writeJsonNew(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx"
  });
}

export async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}
