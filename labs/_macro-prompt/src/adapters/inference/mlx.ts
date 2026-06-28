// MLX engine — local SLM/LLM inference through the official mlx-lm CLI.
//
// Official mlx-lm docs expose:
//   mlx_lm.generate --model <model> --prompt <prompt>
//
// We use that CLI as the first local adapter because it fits the existing
// InferenceAdapter contract without moving the research loop into Python. The CLI
// does not enforce JSON Schema, so the prompt asks for JSON and this adapter parses
// the first JSON object it can find. On any failure it falls back to the caller's
// deterministic offline recipe.

import { execFile } from "node:child_process";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { promisify } from "node:util";
import type { CompleteRequest, InferenceAdapter } from "./index.ts";

const execFileAsync = promisify(execFile);
const DEFAULT_TIMEOUT_MS = Number(process.env.MPL_MLX_TIMEOUT_MS || 120_000);

function commandName(): string {
  return process.env.MPL_MLX_COMMAND || "mlx_lm.generate";
}

function modelName(): string | null {
  return process.env.MPL_MLX_MODEL || process.env.MPL_MODEL || null;
}

async function commandExists(cmd: string): Promise<boolean> {
  if (cmd.includes("/")) {
    try {
      await access(cmd, constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }

  try {
    await execFileAsync("/usr/bin/env", ["sh", "-lc", `command -v ${JSON.stringify(cmd)}`], {
      timeout: 5_000,
      maxBuffer: 1024 * 1024,
    });
    return true;
  } catch {
    return false;
  }
}

function extractJSONObject(text: string): string | null {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first < 0 || last <= first) return null;
  return text.slice(first, last + 1);
}

function mlxPrompt(req: CompleteRequest<unknown>): string {
  return [
    req.system ? `System instruction:\n${req.system}` : null,
    "Return exactly one valid JSON object matching this JSON Schema.",
    "Do not include markdown fences, commentary, or prose outside the JSON object.",
    `JSON Schema:\n${JSON.stringify(req.jsonSchema)}`,
    `Task:\n${req.prompt}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export class MlxAdapter implements InferenceAdapter {
  id = "mlx";
  online = false;
  private command: string;
  private model: string;

  private constructor(command: string, model: string) {
    this.command = command;
    this.model = model;
  }

  static async tryCreate(): Promise<MlxAdapter | null> {
    const model = modelName();
    if (!model) {
      process.stderr.write(
        "[mpl] mlx engine requested but no MPL_MLX_MODEL is set — falling back to heuristic.\n",
      );
      return null;
    }

    const command = commandName();
    if (!(await commandExists(command))) {
      process.stderr.write(
        `[mpl] mlx engine requested but ${command} was not found. Install mlx-lm, then retry — falling back to heuristic.\n`,
      );
      return null;
    }

    return new MlxAdapter(command, model);
  }

  async complete<T>(req: CompleteRequest<T>): Promise<T> {
    try {
      const { stdout, stderr } = await execFileAsync(
        this.command,
        [
          "--model",
          this.model,
          "--prompt",
          mlxPrompt(req),
          "--max-tokens",
          String(req.maxTokens ?? 1024),
        ],
        {
          timeout: DEFAULT_TIMEOUT_MS,
          maxBuffer: 16 * 1024 * 1024,
        },
      );
      const json = extractJSONObject(stdout || stderr);
      if (!json) return await req.fallback();
      return JSON.parse(json) as T;
    } catch (err) {
      process.stderr.write(`[mpl] mlx complete(${req.task}) failed: ${String(err)} — using fallback.\n`);
      return await req.fallback();
    }
  }
}
