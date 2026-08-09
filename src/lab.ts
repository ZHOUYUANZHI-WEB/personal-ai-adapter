import fs from "node:fs/promises";
import path from "node:path";
import { createObjectStore, type StoreDriver } from "./storage.js";

export interface InitializeLabOptions {
  labPath: string;
  driver: StoreDriver;
}

export interface InitializeLabResult {
  labPath: string;
  driver: StoreDriver;
  created: string[];
}

const markdownDirectories = [
  "Inbox",
  "Projects",
  "Knowledge",
  "Daily",
  "Assets",
  "Archive",
  path.join("System", "Context"),
  path.join("System", "Handoffs"),
  path.join("System", "Agents"),
  path.join("System", "Policies"),
  "Templates"
];

const starterFiles: Record<string, string> = {
  "Home.md": `# AI Lab\n\nCapture first. Organize later.\n\n## Start here\n\n- Put unfinished thoughts in \`Inbox/\`.\n- Keep active direction in \`Projects/\`.\n- Keep reusable understanding in \`Knowledge/\`.\n- Use \`Daily/\` for chronological notes.\n\n## System boundary\n\n- Human-owned content is stored as Markdown with YAML Front Matter.\n- Context Bundles are assembled for one task and are not long-term memory.\n- Handoffs transfer structured state, never full chat history.\n- Secrets do not belong in this Vault.\n`,
  [path.join("Templates", "Capture.md")]: `---\ntype: inbox\nstatus: new\nsource:\n  kind: user\n  captured_by: user\n---\n\n`,
  [path.join("Templates", "Project.md")]: `---\ntype: project\nstatus: proposed\nobjective: ""\ncurrent_state: ""\ncurrent_focus: ""\nnext_actions: []\nopen_questions: []\nblockers: []\ndecisions: []\nknowledge_links: []\nasset_links: []\n---\n`,
  [path.join("Templates", "Knowledge.md")]: `---\ntype: knowledge\nstatus: draft\nsummary: ""\nsources: []\nconfidence: uncertain\ncreated_by: user\nrelated_projects: []\nrelated_knowledge: []\n---\n\n`,
  [path.join("Templates", "Daily.md")]: `---\ntype: daily\n---\n\n## Capture\n\n## Today\n\n## Continue later\n`
};

async function writeStarterFile(labPath: string, relativePath: string, content: string): Promise<boolean> {
  const filePath = path.join(labPath, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.writeFile(filePath, content, { encoding: "utf8", flag: "wx" });
    return true;
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "EEXIST") return false;
    throw error;
  }
}

export async function initializeLab(options: InitializeLabOptions): Promise<InitializeLabResult> {
  const labPath = path.resolve(options.labPath);
  const store = createObjectStore(labPath, options.driver);
  await store.initialize();

  const created: string[] = [];
  if (options.driver === "markdown") {
    for (const directory of markdownDirectories) {
      await fs.mkdir(path.join(labPath, directory), { recursive: true });
    }
    for (const [relativePath, content] of Object.entries(starterFiles)) {
      if (await writeStarterFile(labPath, relativePath, content)) created.push(relativePath);
    }
  }

  return { labPath, driver: options.driver, created };
}
