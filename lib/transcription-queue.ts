import type { Note, Recording } from "@/store/app-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ensureModel, transcribe as whisperTranscribe } from "./whisper";

const NOTES_KEY = "@noto/notes";
const RECORDINGS_KEY = "@noto/recordings";

async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Fire-and-forget: downloads model if needed, transcribes the audio,
 * then writes the transcript directly into AsyncStorage for both the
 * Recording and its linked Note. Screens pick up changes via reload().
 */
export function enqueueTranscription(
  recordingId: string,
  noteId: string,
  audioUri: string,
): void {
  runTranscription(recordingId, noteId, audioUri).catch((err) =>
    console.warn("Background transcription error:", err),
  );
}

/**
 * Re-attempt a previously failed transcription.
 * Looks up the recording URI from AsyncStorage and runs again.
 */
export async function retryTranscription(noteId: string): Promise<void> {
  const notes = await loadJson<Note[]>(NOTES_KEY, []);
  const note = notes.find((n) => n.id === noteId);
  if (!note?.recordingId) throw new Error("No linked recording found");

  const recordings = await loadJson<Recording[]>(RECORDINGS_KEY, []);
  const recording = recordings.find((r) => r.id === note.recordingId);
  if (!recording?.uri) throw new Error("Recording file not found");

  const updatedNotes = notes.map((n) =>
    n.id === noteId
      ? {
          ...n,
          transcriptionStatus: "transcribing" as const,
          transcriptionError: undefined,
        }
      : n,
  );
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updatedNotes));

  return runTranscription(recording.id, noteId, recording.uri);
}

async function runTranscription(
  recordingId: string,
  noteId: string,
  audioUri: string,
): Promise<void> {
  try {
    await ensureModel();
    const text = await whisperTranscribe(audioUri);

    const recordings = await loadJson<Recording[]>(RECORDINGS_KEY, []);
    const updatedRecordings = recordings.map((r) =>
      r.id === recordingId ? { ...r, transcript: text } : r,
    );
    await AsyncStorage.setItem(
      RECORDINGS_KEY,
      JSON.stringify(updatedRecordings),
    );

    const notes = await loadJson<Note[]>(NOTES_KEY, []);
    const updatedNotes = notes.map((n) =>
      n.id === noteId
        ? {
            ...n,
            content: text || n.content,
            title: text.split("\n")[0]?.trim().slice(0, 50) || n.title,
            transcriptionStatus: "done" as const,
            transcriptionError: undefined,
            updatedAt: new Date().toISOString(),
          }
        : n,
    );
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updatedNotes));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown transcription error";
    console.error(`Transcription failed for note ${noteId}:`, message);

    const notes = await loadJson<Note[]>(NOTES_KEY, []);
    const updatedNotes = notes.map((n) =>
      n.id === noteId
        ? {
            ...n,
            transcriptionStatus: "failed" as const,
            transcriptionError: message,
          }
        : n,
    );
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updatedNotes));
  }
}
