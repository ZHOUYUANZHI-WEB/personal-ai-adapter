import fs from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

const stableIdPattern = /^[a-z0-9][a-z0-9._:-]*$/;
const storeManifestVersion = 1;

export type StoreDriver = "json" | "markdown";
export type ObjectCollection = "inbox" | "projects" | "knowledge" | "context" | "handoffs";

export interface ObjectStore {
  readonly driver: StoreDriver;
  readonly labPath: string;
  objectPath(collection: ObjectCollection, id: string): string;
  initialize(): Promise<void>;
  writeNew(collection: ObjectCollection, id: string, value: unknown): Promise<string>;
  writeAtomic(collection: ObjectCollection, id: string, value: unknown): Promise<string>;
  read<T>(collection: ObjectCollection, id: string): Promise<T>;
  list<T>(collection: ObjectCollection): Promise<Array<{ path: string; value: T }>>;
}

interface StoreManifest {
  version: number;
  driver: StoreDriver;
}

const jsonCollections: Record<ObjectCollection, string[]> = {
  inbox: ["inbox"],
  projects: ["projects"],
  knowledge: ["knowledge"],
  context: ["context"],
  handoffs: ["handoffs"]
};

const markdownCollections: Record<ObjectCollection, string[]> = {
  inbox: ["Inbox"],
  projects: ["Projects"],
  knowledge: ["Knowledge"],
  context: ["System", "Context"],
  handoffs: ["System", "Handoffs"]
};

function assertObjectId(id: string): void {
  if (!stableIdPattern.test(id)) {
    throw new Error(`Invalid object ID: ${id}`);
  }
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function isExistingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "EEXIST";
}

async function directoryContainsObjects(directory: string, extension: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    return entries.some(
      (entry) => entry.isFile() && !entry.name.startsWith("_") && entry.name.endsWith(`.${extension}`)
    );
  } catch (error: unknown) {
    if (isMissingFile(error)) return false;
    throw error;
  }
}

async function detectExistingDriver(labPath: string): Promise<StoreDriver | undefined> {
  const collections = Object.keys(jsonCollections) as ObjectCollection[];
  const hasJson = (
    await Promise.all(
      collections.map((collection) =>
        directoryContainsObjects(path.join(labPath, ...jsonCollections[collection]), "json")
      )
    )
  ).some(Boolean);
  const hasMarkdown = (
    await Promise.all(
      collections.map((collection) =>
        directoryContainsObjects(path.join(labPath, ...markdownCollections[collection]), "md")
      )
    )
  ).some(Boolean);

  if (hasJson && hasMarkdown) {
    throw new Error("AI Lab contains both unmanaged JSON and Markdown objects; choose and migrate one authority first.");
  }
  if (hasJson) return "json";
  if (hasMarkdown) return "markdown";
  return undefined;
}

abstract class FileObjectStore implements ObjectStore {
  abstract readonly driver: StoreDriver;
  abstract readonly extension: string;
  readonly labPath: string;

  constructor(labPath: string) {
    this.labPath = path.resolve(labPath);
  }

  protected abstract collectionPath(collection: ObjectCollection): string;
  protected abstract serialize(value: unknown): string;
  protected abstract deserialize<T>(content: string, filePath: string): T;

  objectPath(collection: ObjectCollection, id: string): string {
    assertObjectId(id);
    return path.join(this.collectionPath(collection), `${id}.${this.extension}`);
  }

  async initialize(): Promise<void> {
    await this.assertDriver(true);
    await Promise.all(
      (["inbox", "projects", "knowledge", "context", "handoffs"] satisfies ObjectCollection[]).map((collection) =>
        fs.mkdir(this.collectionPath(collection), { recursive: true })
      )
    );
  }

  async writeNew(collection: ObjectCollection, id: string, value: unknown): Promise<string> {
    await this.assertDriver(true);
    const filePath = this.objectPath(collection, id);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, this.serialize(value), { encoding: "utf8", flag: "wx" });
    return filePath;
  }

  async writeAtomic(collection: ObjectCollection, id: string, value: unknown): Promise<string> {
    await this.assertDriver(true);
    const filePath = this.objectPath(collection, id);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const temporaryPath = `${filePath}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, this.serialize(value), { encoding: "utf8", flag: "wx" });
    await fs.rename(temporaryPath, filePath);
    return filePath;
  }

  async read<T>(collection: ObjectCollection, id: string): Promise<T> {
    await this.assertDriver(false);
    const filePath = this.objectPath(collection, id);
    return this.deserialize<T>(await fs.readFile(filePath, "utf8"), filePath);
  }

  async list<T>(collection: ObjectCollection): Promise<Array<{ path: string; value: T }>> {
    await this.assertDriver(false);
    const directory = this.collectionPath(collection);

    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      const paths = entries
        .filter(
          (entry) =>
            entry.isFile() &&
            !entry.name.startsWith("_") &&
            entry.name.endsWith(`.${this.extension}`)
        )
        .map((entry) => path.join(directory, entry.name))
        .sort();

      return Promise.all(
        paths.map(async (filePath) => ({
          path: filePath,
          value: this.deserialize<T>(await fs.readFile(filePath, "utf8"), filePath)
        }))
      );
    } catch (error: unknown) {
      if (isMissingFile(error)) return [];
      throw error;
    }
  }

  private manifestPath(): string {
    return path.join(this.labPath, ".pai", "store.json");
  }

  private async assertDriver(createWhenMissing: boolean): Promise<void> {
    const manifestPath = this.manifestPath();

    try {
      const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as Partial<StoreManifest>;
      if (manifest.version !== storeManifestVersion || (manifest.driver !== "json" && manifest.driver !== "markdown")) {
        throw new Error(`Invalid Store manifest: ${manifestPath}`);
      }
      if (manifest.driver !== this.driver) {
        throw new Error(
          `AI Lab is locked to the ${manifest.driver} Store; refusing to use the ${this.driver} Store.`
        );
      }
      return;
    } catch (error: unknown) {
      if (!isMissingFile(error)) throw error;
    }

    if (!createWhenMissing) return;

    const existingDriver = await detectExistingDriver(this.labPath);
    if (existingDriver && existingDriver !== this.driver) {
      throw new Error(
        `AI Lab already contains ${existingDriver} objects; refusing to initialize the ${this.driver} Store without migration.`
      );
    }

    await fs.mkdir(path.dirname(manifestPath), { recursive: true });
    const manifest: StoreManifest = { version: storeManifestVersion, driver: this.driver };
    try {
      await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
        encoding: "utf8",
        flag: "wx"
      });
    } catch (error: unknown) {
      if (!isExistingFile(error)) throw error;
      await this.assertDriver(false);
    }
  }
}

export class JsonFileStore extends FileObjectStore {
  readonly driver = "json" as const;
  readonly extension = "json";

  protected collectionPath(collection: ObjectCollection): string {
    return path.join(this.labPath, collection);
  }

  protected serialize(value: unknown): string {
    return `${JSON.stringify(value, null, 2)}\n`;
  }

  protected deserialize<T>(content: string): T {
    return JSON.parse(content) as T;
  }
}

function markdownObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Markdown Store objects must be JSON objects.");
  }
  return value as Record<string, unknown>;
}

export class MarkdownVaultStore extends FileObjectStore {
  readonly driver = "markdown" as const;
  readonly extension = "md";

  protected collectionPath(collection: ObjectCollection): string {
    return path.join(this.labPath, ...markdownCollections[collection]);
  }

  protected serialize(value: unknown): string {
    const object = markdownObject(value);
    const metadata = { ...object };
    const body = typeof metadata.content === "string" ? metadata.content : "";
    delete metadata.content;
    const frontMatter = stringifyYaml(metadata, { lineWidth: 0 }).trimEnd();
    return `---\n${frontMatter}\n---\n${body.length > 0 ? `\n${body}\n` : ""}`;
  }

  protected deserialize<T>(content: string, filePath: string): T {
    const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(content.replace(/^\uFEFF/, ""));
    if (!match) {
      throw new Error(`Markdown object is missing YAML Front Matter: ${filePath}`);
    }

    const metadata = markdownObject(parseYaml(match[1] ?? ""));
    const body = (match[2] ?? "").replace(/^\r?\n/, "").replace(/\r?\n$/, "");
    if (body.length > 0) {
      metadata.content = body;
    }
    return metadata as T;
  }
}

export function parseStoreDriver(value: string): StoreDriver {
  if (value !== "json" && value !== "markdown") {
    throw new Error("Store must be json or markdown.");
  }
  return value;
}

export function createObjectStore(labPath: string, driver: StoreDriver = "json"): ObjectStore {
  return driver === "markdown" ? new MarkdownVaultStore(labPath) : new JsonFileStore(labPath);
}

// Compatibility helpers for code written against the v0.1-v0.3 JSON reference implementation.
export function objectPath(labPath: string, collection: ObjectCollection, id: string): string {
  return new JsonFileStore(labPath).objectPath(collection, id);
}

export async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  await fs.rename(temporaryPath, filePath);
}

export async function writeJsonNew(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
}

export async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

export async function listJsonFiles(labPath: string, collection: ObjectCollection): Promise<string[]> {
  const collectionPath = path.join(path.resolve(labPath), collection);
  try {
    const entries = await fs.readdir(collectionPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => path.join(collectionPath, entry.name))
      .sort();
  } catch (error: unknown) {
    if (isMissingFile(error)) return [];
    throw error;
  }
}
