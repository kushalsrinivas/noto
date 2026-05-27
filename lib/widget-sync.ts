import { Platform } from "react-native";

let ExtensionStorage: any = null;

async function getStorage() {
  if (Platform.OS !== "ios") return null;
  if (ExtensionStorage) return ExtensionStorage;

  try {
    const mod = await import("@bacons/apple-targets/storage");
    ExtensionStorage = mod.ExtensionStorage;
    return ExtensionStorage;
  } catch {
    return null;
  }
}

export async function syncWidgetData(noteCount: number, lastNote?: string) {
  const Storage = await getStorage();
  if (!Storage) return;

  try {
    const store = new Storage("group.com.kushalbhai.noto");
    store.set("noteCount", noteCount);
    if (lastNote) {
      store.set("lastNote", lastNote);
    }
  } catch {
    // Widget sync is best-effort
  }
}
