/**
 * Single source of truth for every AsyncStorage / shared-storage key the app
 * uses. Import from here instead of re-declaring string literals so a typo in
 * one module can never silently read or write the wrong bucket.
 *
 * NOTE: the `@noto/` prefix is the historical storage namespace and MUST stay
 * unchanged — renaming it would orphan all existing user data on-device.
 */
export const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: "@noto/onboarding_complete",
  NOTES: "@noto/notes",
  TASKS: "@noto/tasks",
  RECORDINGS: "@noto/recordings",
  USER_NAME: "@noto/user_name",
  AI_MODE: "@noto/ai_mode",
  USAGE_STATS: "@noto/usage_stats",
  FOLDERS: "@noto/folders",
  EMBEDDINGS: "@noto/embeddings",
  REMINDERS_ENABLED: "@noto/reminders_enabled",
  LLM_DOWNLOAD_PROMPTED: "@noto/llm_download_prompted",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
