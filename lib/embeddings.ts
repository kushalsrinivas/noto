import type { Note } from "@/store/app-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getContext, isLlmModelDownloaded, isLlmSupported } from "./llama";

const EMBEDDINGS_KEY = "@noto/embeddings";

type EmbeddingEntry = {
  noteId: string;
  vector: number[];
  contentHash: string;
};

type EmbeddingsStore = EmbeddingEntry[];

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return hash.toString(36);
}

async function loadEmbeddings(): Promise<EmbeddingsStore> {
  try {
    const raw = await AsyncStorage.getItem(EMBEDDINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveEmbeddings(store: EmbeddingsStore): Promise<void> {
  await AsyncStorage.setItem(EMBEDDINGS_KEY, JSON.stringify(store));
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const context = await getContext();
  const result = await context.embedding(text);
  if (!result?.embedding) {
    throw new Error("Embedding generation failed");
  }
  return result.embedding;
}

export async function embedNote(
  noteId: string,
  content: string,
): Promise<void> {
  if (!isLlmSupported() || !isLlmModelDownloaded()) return;
  if (!content.trim()) return;

  try {
    const truncated = content.slice(0, 1500);
    const vector = await generateEmbedding(truncated);
    const hash = simpleHash(content);

    const store = await loadEmbeddings();
    const existing = store.findIndex((e) => e.noteId === noteId);
    const entry: EmbeddingEntry = { noteId, vector, contentHash: hash };

    if (existing >= 0) {
      store[existing] = entry;
    } else {
      store.push(entry);
    }

    await saveEmbeddings(store);
  } catch (err) {
    console.warn("Embedding generation failed for note", noteId, err);
  }
}

export async function removeNoteEmbedding(noteId: string): Promise<void> {
  const store = await loadEmbeddings();
  const filtered = store.filter((e) => e.noteId !== noteId);
  await saveEmbeddings(filtered);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export async function searchSimilarNotes(
  query: string,
  allNotes: Note[],
  topK: number = 3,
): Promise<{ note: Note; score: number }[]> {
  if (!isLlmSupported() || !isLlmModelDownloaded()) {
    return keywordFallback(query, allNotes, topK);
  }

  const store = await loadEmbeddings();
  if (store.length === 0) {
    return keywordFallback(query, allNotes, topK);
  }

  try {
    const queryVector = await generateEmbedding(query);

    const scored = store
      .map((entry) => ({
        noteId: entry.noteId,
        score: cosineSimilarity(queryVector, entry.vector),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored
      .map((s) => {
        const note = allNotes.find((n) => n.id === s.noteId);
        return note ? { note, score: s.score } : null;
      })
      .filter((r): r is { note: Note; score: number } => r !== null);
  } catch {
    return keywordFallback(query, allNotes, topK);
  }
}

function keywordFallback(
  query: string,
  allNotes: Note[],
  topK: number,
): { note: Note; score: number }[] {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter((w) => w.length > 2);

  return allNotes
    .map((note) => {
      const text = `${note.title} ${note.content}`.toLowerCase();
      let score = 0;
      for (const word of words) {
        if (text.includes(word)) score += 1;
      }
      return { note, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export async function rebuildAllEmbeddings(notes: Note[]): Promise<void> {
  if (!isLlmSupported() || !isLlmModelDownloaded()) return;

  const store: EmbeddingsStore = [];
  for (const note of notes) {
    if (!note.content.trim()) continue;
    try {
      const truncated = note.content.slice(0, 1500);
      const vector = await generateEmbedding(truncated);
      store.push({
        noteId: note.id,
        vector,
        contentHash: simpleHash(note.content),
      });
    } catch {
      // skip notes that fail
    }
  }
  await saveEmbeddings(store);
}
