import { Directory, File, Paths } from "expo-file-system";
import * as LegacyFS from "expo-file-system/legacy";
import type { LlamaContext } from "llama.rn";
import { initLlama } from "llama.rn";
import { Platform } from "react-native";

const MODEL_URL =
  "https://huggingface.co/bartowski/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf";
const MODEL_FILENAME = "Qwen2.5-0.5B-Instruct-Q4_K_M.gguf";

let ctx: LlamaContext | null = null;

function getModelFile(): File {
  return new File(Paths.document, "llama", MODEL_FILENAME);
}

function getModelDir(): Directory {
  return new Directory(Paths.document, "llama");
}

function getModelFileUri(): string {
  return (LegacyFS.documentDirectory ?? "") + "llama/" + MODEL_FILENAME;
}

function toNativePath(uri: string): string {
  return uri.replace(/^file:\/\//, "");
}

export function isLlmSupported(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

export function isLlmModelDownloaded(): boolean {
  try {
    return getModelFile().exists;
  } catch {
    return false;
  }
}

/**
 * Downloads the LLM model (~400 MB) with progress reporting.
 * Safe to call multiple times — skips if already downloaded.
 */
export async function ensureLlmModel(
  onProgress?: (fraction: number) => void,
): Promise<void> {
  if (isLlmModelDownloaded()) {
    onProgress?.(1);
    return;
  }

  const dir = getModelDir();
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }

  const fileUri = getModelFileUri();

  const downloadResumable = LegacyFS.createDownloadResumable(
    MODEL_URL,
    fileUri,
    {},
    (data) => {
      if (data.totalBytesExpectedToWrite > 0) {
        onProgress?.(data.totalBytesWritten / data.totalBytesExpectedToWrite);
      }
    },
  );

  const result = await downloadResumable.downloadAsync();
  if (!result) {
    throw new Error("LLM model download was cancelled");
  }

  if (!getModelFile().exists) {
    throw new Error("LLM model download completed but file not found on disk");
  }
  onProgress?.(1);
}

/**
 * Lazily initialise the Llama context. Loads the model into memory (~2-5 s).
 * Reuses the context across calls.
 */
export async function getContext(): Promise<LlamaContext> {
  if (ctx) return ctx;

  const modelFile = getModelFile();
  if (!modelFile.exists) {
    throw new Error(
      "LLM model not found on disk. Call ensureLlmModel() first.",
    );
  }

  ctx = await initLlama({
    model: toNativePath(modelFile.uri),
    use_mlock: true,
    n_ctx: 2048,
    n_gpu_layers: 99,
  });

  return ctx;
}

const STOP_WORDS = [
  "</s>",
  "<|end|>",
  "<|eot_id|>",
  "<|end_of_text|>",
  "<|im_end|>",
  "<|EOT|>",
  "<|END_OF_TURN_TOKEN|>",
  "<|end_of_turn|>",
  "<|endoftext|>",
];

/**
 * Send a prompt to the local LLM and get a text response.
 */
export async function complete(
  systemPrompt: string,
  userMessage: string,
  onToken?: (token: string) => void,
): Promise<string> {
  const context = await getContext();

  const result = await context.completion(
    {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      n_predict: 512,
      stop: STOP_WORDS,
      temperature: 0.3,
      top_p: 0.9,
    },
    (data) => {
      if (onToken && data.token) {
        onToken(data.token);
      }
    },
  );

  return result.text.trim();
}

/**
 * Strip markdown code fences (```json ... ```) the model often wraps output in.
 */
function stripCodeFences(s: string): string {
  return s.replace(/```(?:json|JSON)?/g, "").trim();
}

/**
 * Extract the first *balanced* JSON object/array from arbitrary model text.
 * A balanced scan (string-aware) is used instead of a greedy `\{[\s\S]*\}`
 * regex so trailing prose, multiple blocks, or braces inside strings don't
 * corrupt the candidate.
 */
function extractBalanced(text: string, open: "{" | "["): string | null {
  const close = open === "{" ? "}" : "]";
  const start = text.indexOf(open);
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Light syntactic repair for the most common small-model JSON mistakes:
 * trailing commas and smart quotes. Intentionally conservative — we never
 * guess at structure, we only fix things that are unambiguously invalid.
 */
function repairJson(s: string): string {
  return s
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
}

/**
 * Best-effort parse of model output into JSON of the requested shape.
 * Tries the balanced candidate, then a repaired version. Returns null if
 * nothing parses.
 */
export function parseJsonLoose<T = unknown>(
  raw: string,
  shape: "object" | "array",
): T | null {
  const cleaned = stripCodeFences(raw);
  const candidate =
    extractBalanced(cleaned, shape === "object" ? "{" : "[") ?? cleaned;
  for (const attempt of [candidate, repairJson(candidate)]) {
    try {
      return JSON.parse(attempt) as T;
    } catch {
      // try next strategy
    }
  }
  return null;
}

/**
 * Run a completion and parse its output as JSON. If the first response can't
 * be parsed, re-prompt the model once asking it to repair its own output into
 * strict JSON. Returns null only if both attempts fail.
 */
export async function completeJson<T = unknown>(
  systemPrompt: string,
  userMessage: string,
  shape: "object" | "array",
): Promise<T | null> {
  const first = await complete(systemPrompt, userMessage);
  const parsed = parseJsonLoose<T>(first, shape);
  if (parsed !== null) return parsed;

  const repairSystem = `You output strict JSON only. The previous attempt was not valid JSON.
Return ONLY a single valid JSON ${shape} — no markdown fences, no commentary, no trailing text.`;
  const repairUser = `Fix this into a valid JSON ${shape}:\n\n${first}`;
  const second = await complete(repairSystem, repairUser);
  return parseJsonLoose<T>(second, shape);
}

export type AnalyzedTask = {
  title: string;
  dueDate?: string;
  reminderAt?: string;
};

export type TranscriptAnalysis = {
  summary: string;
  keyPoints: string[];
  tasks: AnalyzedTask[];
};

/**
 * Analyze a transcription: extract summary, key points, and tasks.
 */
export async function analyzeTranscript(
  transcription: string,
): Promise<TranscriptAnalysis> {
  const today = new Date().toISOString().split("T")[0];
  const systemPrompt = `You are a voice note analysis assistant. Today is ${today}.
Given a transcription, produce a JSON object with exactly these keys:
- "summary": a 1-2 sentence summary
- "keyPoints": an array of key points (strings)
- "tasks": an array of objects, each with:
  - "title": the actionable task (string)
  - "dueDate": optional date/time string if mentioned (e.g. "tomorrow at 7pm", "next Monday", "in 2 hours"). Use the exact words from the transcript.
  - "reminderAt": optional, same as dueDate if the speaker says "remind me" or similar intent.

If no date is mentioned for a task, omit dueDate and reminderAt.
Return ONLY valid JSON. No explanation, no markdown.`;

  const parsed = await completeJson<Record<string, unknown>>(
    systemPrompt,
    `Analyze this voice note:\n\n"${transcription}"`,
    "object",
  );

  if (parsed) {
    const rawTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    const tasks: AnalyzedTask[] = rawTasks
      .map((t: string | Record<string, unknown>): AnalyzedTask | null => {
        if (typeof t === "string") return t.trim() ? { title: t.trim() } : null;
        if (t && typeof t === "object" && typeof t.title === "string") {
          return {
            title: t.title,
            dueDate: typeof t.dueDate === "string" ? t.dueDate : undefined,
            reminderAt:
              typeof t.reminderAt === "string" ? t.reminderAt : undefined,
          };
        }
        return null;
      })
      .filter((t): t is AnalyzedTask => t !== null);

    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      keyPoints: Array.isArray(parsed.keyPoints)
        ? parsed.keyPoints.filter((p): p is string => typeof p === "string")
        : [],
      tasks,
    };
  }

  return { summary: "", keyPoints: [], tasks: [] };
}

export async function releaseContext(): Promise<void> {
  if (ctx) {
    await ctx.release();
    ctx = null;
  }
}
