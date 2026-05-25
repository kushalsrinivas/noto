import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: "@noto/onboarding_complete",
  NOTES: "@noto/notes",
  TASKS: "@noto/tasks",
  RECORDINGS: "@noto/recordings",
  USER_NAME: "@noto/user_name",
  AI_MODE: "@noto/ai_mode",
} as const;

export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  source: "voice" | "manual";
  tags: string[];
  recordingId?: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate?: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
  completedAt?: string;
  linkedNoteId?: string;
};

export type Recording = {
  id: string;
  uri: string;
  duration: number;
  transcript?: string;
  createdAt: string;
  linkedNoteId?: string;
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function saveJson(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export function useOnboarding() {
  const [complete, setComplete] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE).then((v) =>
      setComplete(v === "true"),
    );
  }, []);

  const markComplete = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, "true");
    setComplete(true);
  }, []);

  return { complete, markComplete };
}

export function useUserName() {
  const [name, setNameState] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.USER_NAME).then((v) =>
      setNameState(v ?? ""),
    );
  }, []);

  const setName = useCallback(async (n: string) => {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, n);
    setNameState(n);
  }, []);

  return { name, setName };
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await loadJson<Note[]>(STORAGE_KEYS.NOTES, []);
    setNotes(
      data.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addNote = useCallback(
    async (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const newNote: Note = {
        ...note,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newNote, ...notes];
      await saveJson(STORAGE_KEYS.NOTES, updated);
      setNotes(updated);
      return newNote;
    },
    [notes],
  );

  const updateNote = useCallback(
    async (id: string, changes: Partial<Note>) => {
      const updated = notes.map((n) =>
        n.id === id
          ? { ...n, ...changes, updatedAt: new Date().toISOString() }
          : n,
      );
      await saveJson(STORAGE_KEYS.NOTES, updated);
      setNotes(updated);
    },
    [notes],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      const updated = notes.filter((n) => n.id !== id);
      await saveJson(STORAGE_KEYS.NOTES, updated);
      setNotes(updated);
    },
    [notes],
  );

  return { notes, loading, addNote, updateNote, deleteNote, reload };
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await loadJson<Task[]>(STORAGE_KEYS.TASKS, []);
    setTasks(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addTask = useCallback(
    async (task: Omit<Task, "id" | "createdAt" | "completed">) => {
      const newTask: Task = {
        ...task,
        id: generateId(),
        createdAt: new Date().toISOString(),
        completed: false,
      };
      const updated = [newTask, ...tasks];
      await saveJson(STORAGE_KEYS.TASKS, updated);
      setTasks(updated);
      return newTask;
    },
    [tasks],
  );

  const updateTask = useCallback(
    async (id: string, changes: Partial<Task>) => {
      const updated = tasks.map((t) =>
        t.id === id ? { ...t, ...changes } : t,
      );
      await saveJson(STORAGE_KEYS.TASKS, updated);
      setTasks(updated);
    },
    [tasks],
  );

  const toggleTask = useCallback(
    async (id: string) => {
      const updated = tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? new Date().toISOString() : undefined,
            }
          : t,
      );
      await saveJson(STORAGE_KEYS.TASKS, updated);
      setTasks(updated);
    },
    [tasks],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const updated = tasks.filter((t) => t.id !== id);
      await saveJson(STORAGE_KEYS.TASKS, updated);
      setTasks(updated);
    },
    [tasks],
  );

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    reload,
  };
}

export function useRecordings() {
  const [recordings, setRecordings] = useState<Recording[]>([]);

  const reload = useCallback(async () => {
    const data = await loadJson<Recording[]>(STORAGE_KEYS.RECORDINGS, []);
    setRecordings(
      data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addRecording = useCallback(
    async (rec: Omit<Recording, "id" | "createdAt">) => {
      const newRec: Recording = {
        ...rec,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      const updated = [newRec, ...recordings];
      await saveJson(STORAGE_KEYS.RECORDINGS, updated);
      setRecordings(updated);
      return newRec;
    },
    [recordings],
  );

  const deleteRecording = useCallback(
    async (id: string) => {
      const updated = recordings.filter((r) => r.id !== id);
      await saveJson(STORAGE_KEYS.RECORDINGS, updated);
      setRecordings(updated);
    },
    [recordings],
  );

  return { recordings, addRecording, deleteRecording, reload };
}

export function useAiMode() {
  const [mode, setModeState] = useState<"full" | "lite">("lite");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.AI_MODE).then((v) =>
      setModeState(v === "full" ? "full" : "lite"),
    );
  }, []);

  const setMode = useCallback(async (m: "full" | "lite") => {
    await AsyncStorage.setItem(STORAGE_KEYS.AI_MODE, m);
    setModeState(m);
  }, []);

  return { mode, setMode };
}
