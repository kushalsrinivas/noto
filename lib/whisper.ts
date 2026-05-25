import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";
import type { WhisperContext } from "whisper.rn";
import { initWhisper } from "whisper.rn";

const MODEL_URL =
  "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin";
const MODEL_FILENAME = "ggml-tiny.en.bin";

let ctx: WhisperContext | null = null;

function getModelFile(): File {
  return new File(Paths.document, "whisper", MODEL_FILENAME);
}

function getModelDir(): Directory {
  return new Directory(Paths.document, "whisper");
}

/** Strip file:// scheme so native libs get a plain filesystem path. */
function toNativePath(uri: string): string {
  return uri.replace(/^file:\/\//, "");
}

export function isTranscriptionSupported(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

export function isModelDownloaded(): boolean {
  try {
    return getModelFile().exists;
  } catch {
    return false;
  }
}

/**
 * Downloads the Whisper model (~75 MB) to local storage.
 * Safe to call multiple times — skips if already downloaded.
 */
export async function ensureModel(
  onProgress?: (fraction: number) => void,
): Promise<void> {
  if (isModelDownloaded()) {
    onProgress?.(1);
    return;
  }

  const dir = getModelDir();
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }

  const dest = getModelFile();
  await File.downloadFileAsync(MODEL_URL, dest, { idempotent: true });

  if (!dest.exists) {
    throw new Error("Model download completed but file not found on disk");
  }
  onProgress?.(1);
}

/**
 * Lazily initialise the Whisper context. Loads the model into memory (~1-2 s).
 * Reuses the context across calls.
 */
export async function getContext(): Promise<WhisperContext> {
  if (ctx) return ctx;

  const modelFile = getModelFile();
  if (!modelFile.exists) {
    throw new Error(
      "Whisper model not found on disk. Call ensureModel() first.",
    );
  }

  ctx = await initWhisper({ filePath: toNativePath(modelFile.uri) });
  return ctx;
}

/**
 * Transcribe a local audio file and return the text.
 * The audio should be 16 kHz, mono, 16-bit PCM WAV for best results.
 */
export async function transcribe(
  audioUri: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const context = await getContext();
  const filePath = toNativePath(audioUri);

  const { promise } = context.transcribe(filePath, {
    language: "en",
    maxLen: 0,
    onProgress: (p: number) => onProgress?.(p),
  });

  const { result } = await promise;
  return result.trim();
}

export async function releaseContext(): Promise<void> {
  if (ctx) {
    await ctx.release();
    ctx = null;
  }
}
