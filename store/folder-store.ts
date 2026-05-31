import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

import { STORAGE_KEYS } from "@/store/storage-keys";

const FOLDERS_KEY = STORAGE_KEYS.FOLDERS;

export type FolderIcon =
  | "folder"
  | "work"
  | "lightbulb"
  | "school"
  | "person"
  | "mic"
  | "trending-up"
  | "code"
  | "fitness-center"
  | "flight"
  | "home"
  | "shopping-cart"
  | "music-note"
  | "brush"
  | "build"
  | "star"
  | "favorite"
  | "bookmark";

export const FOLDER_ICONS: FolderIcon[] = [
  "folder",
  "work",
  "lightbulb",
  "school",
  "person",
  "mic",
  "trending-up",
  "code",
  "fitness-center",
  "flight",
  "home",
  "shopping-cart",
  "music-note",
  "brush",
  "build",
  "star",
  "favorite",
  "bookmark",
];

export type Folder = {
  id: string;
  name: string;
  icon: FolderIcon;
  color: string;
  parentId?: string;
  pinned: boolean;
  archived: boolean;
  locked: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  isSmart: boolean;
  aiSummary?: string;
  noteCount: number;
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

export async function loadFoldersRaw(): Promise<Folder[]> {
  return loadJson<Folder[]>(FOLDERS_KEY, []);
}

export async function saveFoldersRaw(folders: Folder[]): Promise<void> {
  await saveJson(FOLDERS_KEY, folders);
}

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await loadJson<Folder[]>(FOLDERS_KEY, []);
    setFolders(
      data
        .filter((f) => !f.archived)
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return a.sortOrder - b.sortOrder;
        }),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addFolder = useCallback(
    async (
      folder: Omit<
        Folder,
        "id" | "createdAt" | "updatedAt" | "sortOrder" | "noteCount"
      >,
    ) => {
      const now = new Date().toISOString();
      const all = await loadJson<Folder[]>(FOLDERS_KEY, []);
      const maxOrder = all.reduce((max, f) => Math.max(max, f.sortOrder), -1);
      const newFolder: Folder = {
        ...folder,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        sortOrder: maxOrder + 1,
        noteCount: 0,
      };
      const updated = [...all, newFolder];
      await saveJson(FOLDERS_KEY, updated);
      await reload();
      return newFolder;
    },
    [reload],
  );

  const updateFolder = useCallback(
    async (id: string, changes: Partial<Folder>) => {
      const all = await loadJson<Folder[]>(FOLDERS_KEY, []);
      const updated = all.map((f) =>
        f.id === id
          ? { ...f, ...changes, updatedAt: new Date().toISOString() }
          : f,
      );
      await saveJson(FOLDERS_KEY, updated);
      await reload();
    },
    [reload],
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      const all = await loadJson<Folder[]>(FOLDERS_KEY, []);
      const updated = all.filter((f) => f.id !== id);
      await saveJson(FOLDERS_KEY, updated);
      await reload();
    },
    [reload],
  );

  const togglePin = useCallback(
    async (id: string) => {
      const all = await loadJson<Folder[]>(FOLDERS_KEY, []);
      const updated = all.map((f) =>
        f.id === id
          ? { ...f, pinned: !f.pinned, updatedAt: new Date().toISOString() }
          : f,
      );
      await saveJson(FOLDERS_KEY, updated);
      await reload();
    },
    [reload],
  );

  const archiveFolder = useCallback(
    async (id: string) => {
      const all = await loadJson<Folder[]>(FOLDERS_KEY, []);
      const updated = all.map((f) =>
        f.id === id
          ? { ...f, archived: true, updatedAt: new Date().toISOString() }
          : f,
      );
      await saveJson(FOLDERS_KEY, updated);
      await reload();
    },
    [reload],
  );

  const toggleLock = useCallback(
    async (id: string) => {
      const all = await loadJson<Folder[]>(FOLDERS_KEY, []);
      const updated = all.map((f) =>
        f.id === id
          ? { ...f, locked: !f.locked, updatedAt: new Date().toISOString() }
          : f,
      );
      await saveJson(FOLDERS_KEY, updated);
      await reload();
    },
    [reload],
  );

  const reorder = useCallback(
    async (fromId: string, toId: string) => {
      const all = await loadJson<Folder[]>(FOLDERS_KEY, []);
      const sorted = [...all].sort((a, b) => a.sortOrder - b.sortOrder);
      const fromIdx = sorted.findIndex((f) => f.id === fromId);
      const toIdx = sorted.findIndex((f) => f.id === toId);
      if (fromIdx < 0 || toIdx < 0) return;

      const [moved] = sorted.splice(fromIdx, 1);
      sorted.splice(toIdx, 0, moved);
      const updated = sorted.map((f, i) => ({ ...f, sortOrder: i }));
      await saveJson(FOLDERS_KEY, updated);
      await reload();
    },
    [reload],
  );

  const updateNoteCount = useCallback(
    async (folderId: string, count: number) => {
      const all = await loadJson<Folder[]>(FOLDERS_KEY, []);
      const updated = all.map((f) =>
        f.id === folderId ? { ...f, noteCount: count } : f,
      );
      await saveJson(FOLDERS_KEY, updated);
      await reload();
    },
    [reload],
  );

  const allFolders = useCallback(async () => {
    return loadJson<Folder[]>(FOLDERS_KEY, []);
  }, []);

  return {
    folders,
    loading,
    addFolder,
    updateFolder,
    deleteFolder,
    togglePin,
    archiveFolder,
    toggleLock,
    reorder,
    updateNoteCount,
    allFolders,
    reload,
  };
}
