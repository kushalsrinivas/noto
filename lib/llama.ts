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

export type TranscriptAnalysis = {
  summary: string;
  keyPoints: string[];
  tasks: string[];
};

/**
 * Analyze a transcription: extract summary, key points, and tasks.
 */
export async function analyzeTranscript(
  transcription: string,
): Promise<TranscriptAnalysis> {
  const systemPrompt = `You are a voice note analysis assistant. Given a transcription, produce a JSON object with exactly these keys:
- "summary": a 1-2 sentence summary
- "keyPoints": an array of key points (strings)
- "tasks": an array of actionable tasks (strings)

Return ONLY valid JSON. No explanation, no markdown.`;

  const response = await complete(
    systemPrompt,
    `Analyze this voice note:\n\n"${transcription}"`,
  );

  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      };
    }
  } catch {
    // Fallback: try to extract something useful from plain text
  }

  return { summary: "", keyPoints: [], tasks: [] };
}

export async function releaseContext(): Promise<void> {
  if (ctx) {
    await ctx.release();
    ctx = null;
  }
}
