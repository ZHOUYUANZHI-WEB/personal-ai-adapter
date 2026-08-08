import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv2020, type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import type { FormatsPlugin } from "ajv-formats";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaDirectory = path.join(packageRoot, "schemas");
const require = createRequire(import.meta.url);
const addFormats = require("ajv-formats") as FormatsPlugin;

const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
addFormats(ajv);

for (const filename of fs.readdirSync(schemaDirectory).filter((name) => name.endsWith(".schema.json"))) {
  const schemaPath = path.join(schemaDirectory, filename);
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8")) as Record<string, unknown>;
  ajv.addSchema(schema);
}

function formatter(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) {
    return "unknown validation error";
  }

  return errors
    .map((error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`)
    .join("; ");
}

export function validateObject(schemaName: string, value: unknown): void {
  const schemaId = `https://raw.githubusercontent.com/ZHOUYUANZHI-WEB/personal-ai-adapter/main/schemas/${schemaName}.schema.json`;
  const validate = ajv.getSchema(schemaId) as ValidateFunction | undefined;

  if (!validate) {
    throw new Error(`Schema not registered: ${schemaName}`);
  }

  if (!validate(value)) {
    throw new Error(`Invalid ${schemaName}: ${formatter(validate.errors)}`);
  }
}
