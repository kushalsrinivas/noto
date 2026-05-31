import type { Note, Task } from "@/store/app-store";
import { loadFoldersRaw } from "@/store/folder-store";
import { STORAGE_KEYS } from "@/store/storage-keys";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseNaturalDate } from "./date-parser";
import { embedNote } from "./embeddings";
import { classifyNoteIntoFolder, shouldAutoAssign } from "./folder-classifier";
import {
    analyzeTranscript,
    isLlmModelDownloaded,
    isLlmSupported,
} from "./llama";
import { scheduleTaskReminder } from "./reminder-notifications";

const NOTES_KEY = STORAGE_KEYS.NOTES;
const TASKS_KEY = STORAGE_KEYS.TASKS;

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

    const taskTitles = analysis.tasks.map((t) => t.title);

    const freshNotes = await loadJson<Note[]>(NOTES_KEY, []);
    const updatedNotes = freshNotes.map((n) =>
      n.id === noteId
        ? {
            ...n,
            aiSummary: analysis.summary,
            aiKeyPoints: analysis.keyPoints,
            aiTasks: taskTitles,
            aiStatus: "done" as const,
            updatedAt: new Date().toISOString(),
          }
        : n,
    );
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updatedNotes));

    if (analysis.tasks.length > 0) {
      const tasks = await loadJson<Task[]>(TASKS_KEY, []);
      const newTasks: Task[] = [];

      for (const analyzed of analysis.tasks) {
        const dueDate = analyzed.dueDate
          ? parseNaturalDate(analyzed.dueDate)
          : undefined;
        const reminderAt = analyzed.reminderAt
          ? parseNaturalDate(analyzed.reminderAt)
          : dueDate;

        const task: Task = {
          id: generateId(),
          title: analyzed.title,
          description: "",
          completed: false,
          priority: "medium" as const,
          dueDate,
          reminderAt,
          createdAt: new Date().toISOString(),
          linkedNoteId: noteId,
        };

        if (task.reminderAt) {
          const notifId = await scheduleTaskReminder(task).catch(
            () => undefined,
          );
          if (notifId) task.notificationId = notifId;
        }

        newTasks.push(task);
      }

      await AsyncStorage.setItem(
        TASKS_KEY,
        JSON.stringify([...newTasks, ...tasks]),
      );
    }

    embedNote(noteId, note.content).catch((err) =>
      console.warn("Embedding generation failed (non-blocking):", err),
    );

    classifyAndTagNote(noteId, note).catch((err) =>
      console.warn("Folder classification failed (non-blocking):", err),
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

async function classifyAndTagNote(
  noteId: string,
  note: Pick<Note, "title" | "content">,
): Promise<void> {
  const folders = await loadFoldersRaw();
  const classification = await classifyNoteIntoFolder(note, folders);

  const freshNotes = await loadJson<Note[]>(NOTES_KEY, []);
  const updatedNotes = freshNotes.map((n) => {
    if (n.id !== noteId) return n;

    const changes: Partial<Note> = {
      tags: classification.tags.length > 0 ? classification.tags : n.tags,
    };

    if (shouldAutoAssign(classification) && classification.folderId) {
      changes.folderId = classification.folderId;
      changes.pendingFolderSuggestion = undefined;
    } else if (classification.suggestedFolder || classification.folderId) {
      changes.pendingFolderSuggestion = {
        folderId: classification.folderId ?? undefined,
        folderName:
          classification.suggestedFolder ||
          folders.find((f) => f.id === classification.folderId)?.name ||
          "",
        confidence: classification.confidence,
      };
    }

    return { ...n, ...changes };
  });

  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updatedNotes));
}
