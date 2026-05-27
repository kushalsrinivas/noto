import type { Note, Task } from "@/store/app-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { embedNote } from "./embeddings";
import {
    analyzeTranscript,
    isLlmModelDownloaded,
    isLlmSupported,
} from "./llama";

const NOTES_KEY = "@noto/notes";
const TASKS_KEY = "@noto/tasks";

async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * After transcription completes, run the LLM to extract
 * summary, key points, and tasks from the note content.
 */
export async function processTranscriptionWithLlm(
  noteId: string,
): Promise<void> {
  if (!isLlmSupported()) return;
  if (!isLlmModelDownloaded()) return;

  const notes = await loadJson<Note[]>(NOTES_KEY, []);
  const note = notes.find((n) => n.id === noteId);
  if (!note?.content) return;

  // Mark as processing
  const processingNotes = notes.map((n) =>
    n.id === noteId ? { ...n, aiStatus: "processing" as const } : n,
  );
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(processingNotes));

  try {
    const analysis = await analyzeTranscript(note.content);

    // Save analysis on the note
    const freshNotes = await loadJson<Note[]>(NOTES_KEY, []);
    const updatedNotes = freshNotes.map((n) =>
      n.id === noteId
        ? {
            ...n,
            aiSummary: analysis.summary,
            aiKeyPoints: analysis.keyPoints,
            aiTasks: analysis.tasks,
            aiStatus: "done" as const,
            updatedAt: new Date().toISOString(),
          }
        : n,
    );
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updatedNotes));

    // Also save tasks as standalone Task items linked to the note
    if (analysis.tasks.length > 0) {
      const tasks = await loadJson<Task[]>(TASKS_KEY, []);
      const newTasks: Task[] = analysis.tasks.map((title) => ({
        id: generateId(),
        title,
        description: "",
        completed: false,
        priority: "medium" as const,
        createdAt: new Date().toISOString(),
        linkedNoteId: noteId,
      }));

      await AsyncStorage.setItem(
        TASKS_KEY,
        JSON.stringify([...newTasks, ...tasks]),
      );
    }

    embedNote(noteId, note.content).catch((err) =>
      console.warn("Embedding generation failed (non-blocking):", err),
    );
  } catch (err) {
    console.warn("LLM analysis failed:", err);

    const freshNotes = await loadJson<Note[]>(NOTES_KEY, []);
    const failedNotes = freshNotes.map((n) =>
      n.id === noteId ? { ...n, aiStatus: "failed" as const } : n,
    );
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(failedNotes));
  }
}
