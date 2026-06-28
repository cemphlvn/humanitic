// Local model discovery — advisory only.
//
// This does not load a model. It reports likely local model stores so the app can
// tell the user what is available before an MLX/Ollama/LM Studio adapter is wired.

import { existsSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

export interface LocalModelCandidate {
  provider: "mlx" | "ollama" | "lmstudio" | "huggingface";
  name: string;
  path: string;
  runnable: boolean;
  generative: boolean;
  note: string;
}

export interface MlxRuntimeStatus {
  commandFound: boolean;
  usable: boolean;
  command: string | null;
  error: string | null;
}

function safeDirs(path: string): string[] {
  try {
    if (!existsSync(path)) return [];
    return readdirSync(path)
      .map((name) => join(path, name))
      .filter((p) => {
        try {
          return statSync(p).isDirectory();
        } catch {
          return false;
        }
      });
  } catch {
    return [];
  }
}

function nameFromPath(path: string): string {
  return path.split("/").filter(Boolean).at(-1) ?? path;
}

function huggingFaceModels(root: string): LocalModelCandidate[] {
  return safeDirs(root)
    .filter((p) => nameFromPath(p).startsWith("models--"))
    .map((p) => {
      const name = nameFromPath(p).replace(/^models--/, "").replace(/--/g, "/");
      const lower = name.toLowerCase();
      const isLikelyMLX = lower.includes("mlx") || lower.includes("4bit") || lower.includes("8bit");
      const isEmbedding =
        lower.includes("embedding") ||
        lower.includes("minilm") ||
        lower.includes("mpnet") ||
        lower.includes("bert") ||
        lower.includes("siglip") ||
        lower.includes("whisper");
      return {
        provider: isLikelyMLX ? "mlx" : "huggingface",
        name,
        path: p,
        runnable: isLikelyMLX && !isEmbedding,
        generative: !isEmbedding,
        note:
          isLikelyMLX && !isEmbedding
            ? "Likely MLX-compatible generative model. Use with MPL_ENGINE=mlx and MPL_MLX_MODEL."
            : isLikelyMLX
              ? "Likely MLX-compatible non-generative/embedding model; not suitable for text generation."
              : "Cached Hugging Face model; adapter compatibility unknown.",
      };
    });
}

function ollamaModels(root: string): LocalModelCandidate[] {
  const manifests = join(root, "manifests", "registry.ollama.ai", "library");
  return safeDirs(manifests).flatMap((family) =>
    safeDirs(family).map((tagPath) => ({
      provider: "ollama" as const,
      name: `${nameFromPath(family)}:${nameFromPath(tagPath)}`,
      path: tagPath,
      runnable: true,
      generative: true,
      note: "Ollama model manifest found; would need an Ollama inference adapter.",
    })),
  );
}

function lmStudioModels(root: string): LocalModelCandidate[] {
  return safeDirs(root).flatMap((publisher) =>
    safeDirs(publisher).map((modelPath) => ({
      provider: "lmstudio" as const,
      name: `${nameFromPath(publisher)}/${nameFromPath(modelPath)}`,
      path: modelPath,
      runnable: true,
      generative: true,
      note: "LM Studio model folder found; would need an LM Studio/local server adapter.",
    })),
  );
}

export function mlxRuntimeStatus(): MlxRuntimeStatus {
  let command: string | null = null;
  try {
    command = execFileSync("/usr/bin/env", ["sh", "-lc", "command -v mlx_lm.generate"], {
      encoding: "utf8",
      timeout: 5_000,
    }).trim();
  } catch (err) {
    return {
      commandFound: false,
      usable: false,
      command: null,
      error: `mlx_lm.generate not found: ${String(err)}`,
    };
  }

  try {
    execFileSync(command, ["--help"], {
      encoding: "utf8",
      stdio: "pipe",
      timeout: 15_000,
      maxBuffer: 1024 * 1024,
    });
    return { commandFound: true, usable: true, command, error: null };
  } catch (err) {
    const e = err as { stderr?: Buffer | string; stdout?: Buffer | string; message?: string };
    const stderr = Buffer.isBuffer(e.stderr) ? e.stderr.toString("utf8") : (e.stderr ?? "");
    const stdout = Buffer.isBuffer(e.stdout) ? e.stdout.toString("utf8") : (e.stdout ?? "");
    const detail = `${stderr || stdout || e.message || String(err)}`.trim();
    return {
      commandFound: true,
      usable: false,
      command,
      error: detail.split("\n").find((line) => line.includes("No Metal device available")) ?? detail.slice(0, 500),
    };
  }
}

export function discoverLocalModels(): LocalModelCandidate[] {
  const home = homedir();
  const candidates: LocalModelCandidate[] = [
    ...huggingFaceModels(join(home, ".cache", "huggingface", "hub")),
    ...ollamaModels(join(home, ".ollama", "models")),
    ...lmStudioModels(join(home, ".lmstudio", "models")),
  ];

  const seen = new Set<string>();
  return candidates.filter((m) => {
    const key = `${m.provider}:${m.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
