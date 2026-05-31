import type { Note } from "@/store/app-store";
import type { Folder } from "@/store/folder-store";
import {
    complete,
    completeJson,
    isLlmModelDownloaded,
    isLlmSupported,
} from "./llama";

export type FolderClassification = {
  folderId: string | null;
  suggestedFolder: string;
  confidence: number;
  tags: string[];
};

const CONFIDENCE_THRESHOLD = 0.7;

export async function classifyNoteIntoFolder(
  note: Pick<Note, "title" | "content">,
  folders: Folder[],
): Promise<FolderClassification> {
  if (!isLlmSupported() || !isLlmModelDownloaded()) {
    return { folderId: null, suggestedFolder: "", confidence: 0, tags: [] };
  }

  const folderList =
    folders.length > 0
      ? folders.map((f) => `- "${f.name}" (id: ${f.id})`).join("\n")
      : "(no folders exist yet)";

  const notePreview = (note.title + "\n" + note.content).slice(0, 800);

  const systemPrompt = `You classify notes into folders. Given a note and existing folders, return a JSON object with:
- "folderId": the id of the best matching folder, or null if none fit
- "suggestedFolder": if folderId is null, suggest a short folder name (2-3 words max), otherwise empty string
- "confidence": a number from 0.0 to 1.0 indicating how well the note fits
- "tags": an array of 2-5 lowercase topic tags extracted from the note content

Return ONLY valid JSON. No explanation.`;

  const userMessage = `Existing folders:\n${folderList}\n\nNote:\n"${notePreview}"`;

  try {
    const parsed = await completeJson<Record<string, unknown>>(
      systemPrompt,
      userMessage,
      "object",
    );
    if (parsed) {
      const folderId =
        typeof parsed.folderId === "string" ? parsed.folderId : null;
      const validFolder =
        folderId && folders.some((f) => f.id === folderId) ? folderId : null;

      return {
        folderId: validFolder,
        suggestedFolder:
          typeof parsed.suggestedFolder === "string"
            ? parsed.suggestedFolder.slice(0, 30)
            : "",
        confidence:
          typeof parsed.confidence === "number"
            ? Math.min(1, Math.max(0, parsed.confidence))
            : 0.5,
        tags: Array.isArray(parsed.tags)
          ? parsed.tags
              .filter((t: unknown): t is string => typeof t === "string")
              .map((t) => t.toLowerCase().trim())
              .slice(0, 5)
          : [],
      };
    }
  } catch (err) {
    console.warn("Folder classification failed:", err);
  }

  return { folderId: null, suggestedFolder: "", confidence: 0, tags: [] };
}

export async function extractNoteTags(content: string): Promise<string[]> {
  if (!isLlmSupported() || !isLlmModelDownloaded()) return [];
  if (!content.trim()) return [];

  const systemPrompt = `Extract 2-5 topic tags from the given text. Return ONLY a JSON array of lowercase strings. No explanation.`;

  try {
    const parsed = await completeJson<unknown[]>(
      systemPrompt,
      `"${content.slice(0, 600)}"`,
      "array",
    );
    if (Array.isArray(parsed)) {
      return parsed
        .filter((t: unknown): t is string => typeof t === "string")
        .map((t) => t.toLowerCase().trim())
        .filter((t) => t.length > 0 && t.length <= 30)
        .slice(0, 5);
    }
  } catch {
    // best-effort
  }

  return [];
}

export async function generateFolderSummary(
  notes: Pick<Note, "title" | "content">[],
): Promise<string> {
  if (!isLlmSupported() || !isLlmModelDownloaded()) return "";
  if (notes.length === 0) return "";

  const previews = notes
    .slice(0, 10)
    .map(
      (n, i) =>
        `${i + 1}. ${n.title || "Untitled"}: ${n.content.slice(0, 200)}`,
    )
    .join("\n");

  const systemPrompt = `Summarize the themes of these notes in one sentence. Be concise. Return only the summary text, nothing else.`;

  try {
    const response = await complete(systemPrompt, previews);
    return response.slice(0, 200);
  } catch {
    return "";
  }
}

export function shouldAutoAssign(
  classification: FolderClassification,
): boolean {
  return (
    classification.folderId !== null &&
    classification.confidence >= CONFIDENCE_THRESHOLD
  );
}

let summaryTimer: ReturnType<typeof setTimeout> | null = null;

export function debouncedRegenerateFolderSummary(
  folderId: string,
  delayMs = 5000,
): void {
  if (summaryTimer) clearTimeout(summaryTimer);
  summaryTimer = setTimeout(async () => {
    try {
      const { loadFoldersRaw, saveFoldersRaw } =
        await import("@/store/folder-store");
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      const { STORAGE_KEYS } = await import("@/store/storage-keys");
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
      const allNotes: Note[] = raw ? JSON.parse(raw) : [];
      const folderNotes = allNotes.filter((n) => n.folderId === folderId);
      if (folderNotes.length === 0) return;

      const summary = await generateFolderSummary(folderNotes);
      if (!summary) return;

      const folders = await loadFoldersRaw();
      const updated = folders.map((f) =>
        f.id === folderId ? { ...f, aiSummary: summary } : f,
      );
      await saveFoldersRaw(updated);
    } catch {
      // best-effort
    }
  }, delayMs);
}
